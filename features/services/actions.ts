"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/features/organizations/current";
import { serviceCategorySchema, serviceSchema } from "@/lib/validations/service";

export type ServiceActionState = {
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
        error: "Cadastre uma empresa antes de gerenciar servicos."
      } satisfies ServiceActionState
    };
  }

  return { user, organization, state: null };
}

export async function createServiceCategoryAction(formData: FormData) {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);
  if (!organization) throw new Error("Cadastre uma empresa antes de criar categorias.");

  const parsed = serviceCategorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description")
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Dados invalidos.");

  const supabase = await createClient();
  const { error } = await supabase.from("service_categories").insert({
    organization_id: organization.id,
    name: parsed.data.name,
    description: parsed.data.description || null
  });

  if (error) throw new Error("Nao foi possivel criar a categoria.");
  revalidatePath("/servicos");
}

export async function createServiceAction(formData: FormData) {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);
  if (!organization) throw new Error("Cadastre uma empresa antes de criar servicos.");

  const parsed = serviceSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    durationMinutes: formData.get("durationMinutes"),
    marginBeforeMinutes: formData.get("marginBeforeMinutes"),
    marginAfterMinutes: formData.get("marginAfterMinutes"),
    priceCents: formData.get("priceCents"),
    isOnline: formData.get("isOnline") === "on"
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Dados invalidos.");

  const supabase = await createClient();
  const { error } = await supabase.from("services").insert({
    organization_id: organization.id,
    category_id: parsed.data.categoryId || null,
    name: parsed.data.name,
    description: parsed.data.description || null,
    image_url: parsed.data.imageUrl || null,
    duration_minutes: parsed.data.durationMinutes,
    margin_before_minutes: parsed.data.marginBeforeMinutes,
    margin_after_minutes: parsed.data.marginAfterMinutes,
    price_cents: parsed.data.priceCents,
    is_online: parsed.data.isOnline
  });

  if (error) throw new Error("Nao foi possivel criar o servico.");
  revalidatePath("/servicos");
  revalidatePath(`/p/${organization.slug}`);
}

export async function createServiceCategoryStateAction(
  previousState: ServiceActionState,
  formData: FormData
): Promise<ServiceActionState> {
  void previousState;
  const { organization, state } = await getOrganizationOrState();
  if (!organization) return state;

  const parsed = serviceCategorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description")
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Revise os dados." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("service_categories").insert({
    organization_id: organization.id,
    name: parsed.data.name,
    description: parsed.data.description || null
  });

  if (error) {
    console.error("createServiceCategoryStateAction", error);
    return { ok: false, error: "Nao foi possivel criar a categoria. Tente novamente." };
  }

  revalidatePath("/servicos");
  return { ok: true, message: "Categoria criada com sucesso." };
}

export async function createServiceStateAction(
  previousState: ServiceActionState,
  formData: FormData
): Promise<ServiceActionState> {
  void previousState;
  const { organization, state } = await getOrganizationOrState();
  if (!organization) return state;

  const parsed = serviceSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    durationMinutes: formData.get("durationMinutes"),
    marginBeforeMinutes: formData.get("marginBeforeMinutes"),
    marginAfterMinutes: formData.get("marginAfterMinutes"),
    priceCents: formData.get("priceCents"),
    isOnline: formData.get("isOnline") === "on"
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Revise os dados." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("services").insert({
    organization_id: organization.id,
    category_id: parsed.data.categoryId || null,
    name: parsed.data.name,
    description: parsed.data.description || null,
    image_url: parsed.data.imageUrl || null,
    duration_minutes: parsed.data.durationMinutes,
    margin_before_minutes: parsed.data.marginBeforeMinutes,
    margin_after_minutes: parsed.data.marginAfterMinutes,
    price_cents: parsed.data.priceCents,
    is_online: parsed.data.isOnline
  });

  if (error) {
    console.error("createServiceStateAction", error);
    return { ok: false, error: "Nao foi possivel criar o servico. Tente novamente." };
  }

  revalidatePath("/servicos");
  revalidatePath(`/p/${organization.slug}`);
  return { ok: true, message: "Servico criado com sucesso." };
}

export async function updateServiceAction(formData: FormData) {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);
  if (!organization) throw new Error("Cadastre uma empresa antes de editar servicos.");

  const serviceId = String(formData.get("serviceId") ?? "");
  if (!serviceId) throw new Error("Servico nao informado.");

  const parsed = serviceSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    durationMinutes: formData.get("durationMinutes"),
    marginBeforeMinutes: formData.get("marginBeforeMinutes"),
    marginAfterMinutes: formData.get("marginAfterMinutes"),
    priceCents: formData.get("priceCents"),
    isOnline: formData.get("isOnline") === "on"
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Revise os dados.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({
      category_id: parsed.data.categoryId || null,
      name: parsed.data.name,
      description: parsed.data.description || null,
      image_url: parsed.data.imageUrl || null,
      duration_minutes: parsed.data.durationMinutes,
      margin_before_minutes: parsed.data.marginBeforeMinutes,
      margin_after_minutes: parsed.data.marginAfterMinutes,
      price_cents: parsed.data.priceCents,
      is_online: parsed.data.isOnline,
      updated_at: new Date().toISOString()
    })
    .eq("id", serviceId)
    .eq("organization_id", organization.id);

  if (error) {
    console.error("updateServiceAction", error);
    throw new Error("Nao foi possivel atualizar o servico.");
  }

  revalidatePath("/servicos");
  revalidatePath(`/p/${organization.slug}`);
}
