"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/features/organizations/current";
import { contactSchema, dealActivitySchema, dealSchema } from "@/lib/validations/crm";

export type CrmActionState = {
  ok: boolean;
  message?: string;
  error?: string;
};

async function getOrganizationOrState() {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);

  if (!organization) {
    return {
      user,
      organization: null,
      state: {
        ok: false,
        error: "Cadastre uma empresa antes de usar o CRM."
      } satisfies CrmActionState
    };
  }

  return { user, organization, state: null };
}

async function ensureDefaultPipeline(organizationId: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("pipelines")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_default", true)
    .maybeSingle();

  if (existing) {
    const { data: firstStage } = await supabase
      .from("pipeline_stages")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("pipeline_id", existing.id)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    return { pipelineId: existing.id, stageId: firstStage?.id ?? null };
  }

  const { data: pipeline, error: pipelineError } = await supabase
    .from("pipelines")
    .insert({
      organization_id: organizationId,
      name: "Pipeline Comercial",
      is_default: true
    })
    .select("id")
    .single();

  if (pipelineError || !pipeline) return { pipelineId: null, stageId: null };

  const defaultStages = [
    { name: "Novo Lead", position: 1, probability: 10 },
    { name: "Contato Feito", position: 2, probability: 30 },
    { name: "Proposta", position: 3, probability: 60 },
    { name: "Negociacao", position: 4, probability: 80 },
    { name: "Ganho", position: 5, probability: 100, is_won: true },
    { name: "Perdido", position: 6, probability: 0, is_lost: true }
  ];

  const { data: stages } = await supabase
    .from("pipeline_stages")
    .insert(
      defaultStages.map((stage) => ({
        organization_id: organizationId,
        pipeline_id: pipeline.id,
        ...stage
      }))
    )
    .select("id")
    .order("position", { ascending: true });

  return { pipelineId: pipeline.id, stageId: stages?.[0]?.id ?? null };
}

export async function createContactAction(formData: FormData) {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);
  if (!organization) throw new Error("Cadastre uma empresa antes de criar leads.");

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    companyName: formData.get("companyName"),
    source: formData.get("source"),
    notes: formData.get("notes"),
    lgpdConsent: formData.get("lgpdConsent") === "on"
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Dados invalidos.");

  const supabase = await createClient();
  const { error } = await supabase.from("contacts").insert({
    organization_id: organization.id,
    owner_id: user.id,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    company_name: parsed.data.companyName || null,
    source: parsed.data.source || "manual",
    notes: parsed.data.notes || null,
    lgpd_consent_at: parsed.data.lgpdConsent ? new Date().toISOString() : null,
    lgpd_consent_source: parsed.data.lgpdConsent ? "manual_admin" : null
  });

  if (error) throw new Error("Nao foi possivel criar o lead.");
  revalidatePath("/crm");
}

export async function createDealAction(formData: FormData) {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);
  if (!organization) throw new Error("Cadastre uma empresa antes de criar oportunidades.");

  const parsed = dealSchema.safeParse({
    contactId: formData.get("contactId"),
    title: formData.get("title"),
    valueCents: formData.get("valueCents"),
    expectedCloseDate: formData.get("expectedCloseDate")
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Dados invalidos.");

  const { pipelineId, stageId } = await ensureDefaultPipeline(organization.id);
  if (!pipelineId || !stageId) throw new Error("Nao foi possivel preparar o pipeline.");

  const supabase = await createClient();
  const { error } = await supabase.from("deals").insert({
    organization_id: organization.id,
    pipeline_id: pipelineId,
    stage_id: stageId,
    contact_id: parsed.data.contactId,
    owner_id: user.id,
    title: parsed.data.title,
    value_cents: parsed.data.valueCents,
    expected_close_date: parsed.data.expectedCloseDate || null
  });

  if (error) throw new Error("Nao foi possivel criar a oportunidade.");
  revalidatePath("/crm");
}

export async function createDealActivityAction(formData: FormData) {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);
  if (!organization) throw new Error("Cadastre uma empresa antes de criar atividades.");

  const parsed = dealActivitySchema.safeParse({
    dealId: formData.get("dealId"),
    contactId: formData.get("contactId"),
    type: formData.get("type"),
    title: formData.get("title"),
    body: formData.get("body"),
    dueAt: formData.get("dueAt")
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Dados invalidos.");

  const supabase = await createClient();
  const { error } = await supabase.from("deal_activities").insert({
    organization_id: organization.id,
    deal_id: parsed.data.dealId || null,
    contact_id: parsed.data.contactId || null,
    actor_id: user.id,
    type: parsed.data.type,
    title: parsed.data.title,
    body: parsed.data.body || null,
    due_at: parsed.data.dueAt ? new Date(parsed.data.dueAt).toISOString() : null
  });

  if (error) throw new Error("Nao foi possivel criar a atividade.");
  revalidatePath("/crm");
}

export async function createContactStateAction(
  previousState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  void previousState;
  const { user, organization, state } = await getOrganizationOrState();
  if (!organization) return state;

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    companyName: formData.get("companyName"),
    source: formData.get("source"),
    notes: formData.get("notes"),
    lgpdConsent: formData.get("lgpdConsent") === "on"
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Revise os dados." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contacts").insert({
    organization_id: organization.id,
    owner_id: user.id,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    company_name: parsed.data.companyName || null,
    source: parsed.data.source || "manual",
    notes: parsed.data.notes || null,
    lgpd_consent_at: parsed.data.lgpdConsent ? new Date().toISOString() : null,
    lgpd_consent_source: parsed.data.lgpdConsent ? "manual_admin" : null
  });

  if (error) {
    console.error("createContactStateAction", error);
    return { ok: false, error: "Nao foi possivel criar o lead. Tente novamente." };
  }

  revalidatePath("/crm");
  return { ok: true, message: "Lead criado com sucesso." };
}

export async function createDealStateAction(
  previousState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  void previousState;
  const { user, organization, state } = await getOrganizationOrState();
  if (!organization) return state;

  const parsed = dealSchema.safeParse({
    contactId: formData.get("contactId"),
    title: formData.get("title"),
    valueCents: formData.get("valueCents"),
    expectedCloseDate: formData.get("expectedCloseDate")
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Revise os dados." };
  }

  const { pipelineId, stageId } = await ensureDefaultPipeline(organization.id);
  if (!pipelineId || !stageId) {
    return { ok: false, error: "Nao foi possivel preparar o pipeline." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("deals").insert({
    organization_id: organization.id,
    pipeline_id: pipelineId,
    stage_id: stageId,
    contact_id: parsed.data.contactId,
    owner_id: user.id,
    title: parsed.data.title,
    value_cents: parsed.data.valueCents,
    expected_close_date: parsed.data.expectedCloseDate || null
  });

  if (error) {
    console.error("createDealStateAction", error);
    return { ok: false, error: "Nao foi possivel criar a oportunidade." };
  }

  revalidatePath("/crm");
  return { ok: true, message: "Oportunidade criada com sucesso." };
}

export async function createDealActivityStateAction(
  previousState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  void previousState;
  const { user, organization, state } = await getOrganizationOrState();
  if (!organization) return state;

  const parsed = dealActivitySchema.safeParse({
    dealId: formData.get("dealId"),
    contactId: formData.get("contactId"),
    type: formData.get("type"),
    title: formData.get("title"),
    body: formData.get("body"),
    dueAt: formData.get("dueAt")
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Revise os dados." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("deal_activities").insert({
    organization_id: organization.id,
    deal_id: parsed.data.dealId || null,
    contact_id: parsed.data.contactId || null,
    actor_id: user.id,
    type: parsed.data.type,
    title: parsed.data.title,
    body: parsed.data.body || null,
    due_at: parsed.data.dueAt ? new Date(parsed.data.dueAt).toISOString() : null
  });

  if (error) {
    console.error("createDealActivityStateAction", error);
    return { ok: false, error: "Nao foi possivel salvar a atividade." };
  }

  revalidatePath("/crm");
  return { ok: true, message: "Atividade salva." };
}
