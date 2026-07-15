"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/features/organizations/current";
import {
  automationSchema,
  conversationSchema,
  messageSchema,
  taskSchema
} from "@/lib/validations/operations";

export type OperationsActionState = {
  ok: boolean;
  message?: string;
  error?: string;
};

async function getOrganizationOrState(scope: string) {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);

  if (!organization) {
    return {
      user,
      organization: null,
      state: {
        ok: false,
        error: `Cadastre uma empresa antes de usar ${scope}.`
      } satisfies OperationsActionState
    };
  }

  return { user, organization, state: null };
}

export async function createConversationAction(formData: FormData) {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);
  if (!organization) throw new Error("Cadastre uma empresa antes do atendimento.");

  const parsed = conversationSchema.safeParse({
    contactId: formData.get("contactId"),
    channel: formData.get("channel"),
    subject: formData.get("subject"),
    lgpdContext: formData.get("lgpdContext")
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Dados invalidos.");

  const supabase = await createClient();
  const { error } = await supabase.from("conversations").insert({
    organization_id: organization.id,
    contact_id: parsed.data.contactId || null,
    assigned_to: user.id,
    channel: parsed.data.channel,
    subject: parsed.data.subject,
    lgpd_context: parsed.data.lgpdContext || null,
    last_message_at: new Date().toISOString()
  });

  if (error) throw new Error("Nao foi possivel criar o atendimento.");
  revalidatePath("/atendimento");
}

export async function createMessageAction(formData: FormData) {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);
  if (!organization) throw new Error("Cadastre uma empresa antes do atendimento.");

  const parsed = messageSchema.safeParse({
    conversationId: formData.get("conversationId"),
    body: formData.get("body")
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Dados invalidos.");

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    organization_id: organization.id,
    conversation_id: parsed.data.conversationId,
    actor_id: user.id,
    direction: "OUTBOUND",
    status: "DRAFT",
    body: parsed.data.body
  });

  if (error) throw new Error("Nao foi possivel registrar a mensagem.");
  revalidatePath("/atendimento");
}

export async function createTaskAction(formData: FormData) {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);
  if (!organization) throw new Error("Cadastre uma empresa antes das tarefas.");

  const parsed = taskSchema.safeParse({
    contactId: formData.get("contactId"),
    dealId: formData.get("dealId"),
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    dueAt: formData.get("dueAt")
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Dados invalidos.");

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    organization_id: organization.id,
    contact_id: parsed.data.contactId || null,
    deal_id: parsed.data.dealId || null,
    assigned_to: user.id,
    created_by: user.id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    priority: parsed.data.priority,
    due_at: parsed.data.dueAt ? new Date(parsed.data.dueAt).toISOString() : null
  });

  if (error) throw new Error("Nao foi possivel criar a tarefa.");
  revalidatePath("/tarefas");
}

export async function createAutomationAction(formData: FormData) {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);
  if (!organization) throw new Error("Cadastre uma empresa antes das automacoes.");

  const parsed = automationSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    triggerKey: formData.get("triggerKey"),
    status: formData.get("status")
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Dados invalidos.");

  const supabase = await createClient();
  const { error } = await supabase.from("automations").insert({
    organization_id: organization.id,
    name: parsed.data.name,
    description: parsed.data.description || null,
    status: parsed.data.status,
    trigger_key: parsed.data.triggerKey,
    created_by: user.id
  });

  if (error) throw new Error("Nao foi possivel criar a automacao.");
  revalidatePath("/automacoes");
}

export async function createConversationStateAction(
  previousState: OperationsActionState,
  formData: FormData
): Promise<OperationsActionState> {
  void previousState;
  const { user, organization, state } = await getOrganizationOrState("o atendimento");
  if (!organization) return state;

  const parsed = conversationSchema.safeParse({
    contactId: formData.get("contactId"),
    channel: formData.get("channel"),
    subject: formData.get("subject"),
    lgpdContext: formData.get("lgpdContext")
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Revise os dados." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("conversations").insert({
    organization_id: organization.id,
    contact_id: parsed.data.contactId || null,
    assigned_to: user.id,
    channel: parsed.data.channel,
    subject: parsed.data.subject,
    lgpd_context: parsed.data.lgpdContext || null,
    last_message_at: new Date().toISOString()
  });

  if (error) {
    console.error("createConversationStateAction", error);
    return { ok: false, error: "Nao foi possivel criar o atendimento." };
  }

  revalidatePath("/atendimento");
  return { ok: true, message: "Atendimento criado com sucesso." };
}

export async function createMessageStateAction(
  previousState: OperationsActionState,
  formData: FormData
): Promise<OperationsActionState> {
  void previousState;
  const { user, organization, state } = await getOrganizationOrState("o atendimento");
  if (!organization) return state;

  const parsed = messageSchema.safeParse({
    conversationId: formData.get("conversationId"),
    body: formData.get("body")
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Revise a mensagem." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    organization_id: organization.id,
    conversation_id: parsed.data.conversationId,
    actor_id: user.id,
    direction: "OUTBOUND",
    status: "DRAFT",
    body: parsed.data.body
  });

  if (error) {
    console.error("createMessageStateAction", error);
    return { ok: false, error: "Nao foi possivel registrar a mensagem." };
  }

  revalidatePath("/atendimento");
  return { ok: true, message: "Mensagem registrada." };
}

export async function createTaskStateAction(
  previousState: OperationsActionState,
  formData: FormData
): Promise<OperationsActionState> {
  void previousState;
  const { user, organization, state } = await getOrganizationOrState("as tarefas");
  if (!organization) return state;

  const parsed = taskSchema.safeParse({
    contactId: formData.get("contactId"),
    dealId: formData.get("dealId"),
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    dueAt: formData.get("dueAt")
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Revise os dados." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    organization_id: organization.id,
    contact_id: parsed.data.contactId || null,
    deal_id: parsed.data.dealId || null,
    assigned_to: user.id,
    created_by: user.id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    priority: parsed.data.priority,
    due_at: parsed.data.dueAt ? new Date(parsed.data.dueAt).toISOString() : null
  });

  if (error) {
    console.error("createTaskStateAction", error);
    return { ok: false, error: "Nao foi possivel criar a tarefa." };
  }

  revalidatePath("/tarefas");
  return { ok: true, message: "Tarefa criada com sucesso." };
}

export async function createAutomationStateAction(
  previousState: OperationsActionState,
  formData: FormData
): Promise<OperationsActionState> {
  void previousState;
  const { user, organization, state } = await getOrganizationOrState("as automacoes");
  if (!organization) return state;

  const parsed = automationSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    triggerKey: formData.get("triggerKey"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Revise os dados." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("automations").insert({
    organization_id: organization.id,
    name: parsed.data.name,
    description: parsed.data.description || null,
    status: parsed.data.status,
    trigger_key: parsed.data.triggerKey,
    created_by: user.id
  });

  if (error) {
    console.error("createAutomationStateAction", error);
    return { ok: false, error: "Nao foi possivel criar a automacao." };
  }

  revalidatePath("/automacoes");
  return { ok: true, message: "Automacao criada com sucesso." };
}
