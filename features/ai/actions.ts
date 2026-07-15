"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/features/organizations/current";
import { aiAgentSchema } from "@/lib/validations/ai";

export type AiActionState = {
  ok: boolean;
  message?: string;
  error?: string;
};

export async function createAiAgentAction(formData: FormData) {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);
  if (!organization) throw new Error("Cadastre uma empresa antes dos agentes de IA.");

  const parsed = aiAgentSchema.safeParse({
    name: formData.get("name"),
    goal: formData.get("goal"),
    status: formData.get("status"),
    instructions: formData.get("instructions"),
    guardrails: formData.get("guardrails")
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Dados invalidos.");

  const supabase = await createClient();
  const { error } = await supabase.from("ai_agents").insert({
    organization_id: organization.id,
    name: parsed.data.name,
    goal: parsed.data.goal,
    status: parsed.data.status,
    instructions: parsed.data.instructions,
    guardrails: parsed.data.guardrails || null,
    created_by: user.id
  });

  if (error) throw new Error("Nao foi possivel criar o agente.");
  revalidatePath("/ia");
}

export async function createAiAgentStateAction(
  previousState: AiActionState,
  formData: FormData
): Promise<AiActionState> {
  void previousState;

  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);

  if (!organization) {
    return { ok: false, error: "Cadastre sua empresa antes de criar agentes de IA." };
  }

  const parsed = aiAgentSchema.safeParse({
    name: formData.get("name"),
    goal: formData.get("goal"),
    status: formData.get("status"),
    instructions: formData.get("instructions"),
    guardrails: formData.get("guardrails")
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Revise os dados do agente." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ai_agents").insert({
    organization_id: organization.id,
    name: parsed.data.name,
    goal: parsed.data.goal,
    status: parsed.data.status,
    instructions: parsed.data.instructions,
    guardrails: parsed.data.guardrails || null,
    created_by: user.id
  });

  if (error) {
    console.error("createAiAgentStateAction", error);
    return { ok: false, error: "Nao foi possivel criar o agente agora." };
  }

  revalidatePath("/ia");
  return { ok: true, message: "Agente criado com sucesso." };
}
