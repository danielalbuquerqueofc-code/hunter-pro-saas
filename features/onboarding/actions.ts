"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { organizationSchema } from "@/lib/validations/organization";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getCurrentOrganization } from "@/features/organizations/current";

function toSlug(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function redirectWithError(message: string): never {
  redirect(`/configuracoes?error=${encodeURIComponent(message)}`);
}

function formatCreateOrganizationError(error: string) {
  const normalized = error.toLowerCase();

  if (normalized.includes("could not find the function") || normalized.includes("function")) {
    return "A funcao de criar empresa nao existe no Supabase. Rode a migration 0001 no SQL Editor.";
  }

  if (normalized.includes("relation") && normalized.includes("does not exist")) {
    return "Uma tabela da Fase 1 nao existe no Supabase. Rode a migration 0001 no SQL Editor.";
  }

  if (normalized.includes("duplicate") || normalized.includes("unique")) {
    return "Esse endereco publico ja existe. O sistema tentou variacoes automaticas, mas nao conseguiu criar.";
  }

  if (normalized.includes("permission") || normalized.includes("policy")) {
    return "O Supabase bloqueou por permissao/RLS. Confira se a migration 0001 foi aplicada completamente.";
  }

  return `Nao foi possivel criar a empresa. Erro do Supabase: ${error}`;
}

export async function createOrganizationAction(formData: FormData) {
  const user = await requireUser();
  const current = await getCurrentOrganization(user.id);

  if (current.organization) {
    redirect("/dashboard");
  }

  const name = formData.get("name");
  const requestedSlug = formData.get("slug");
  const slug = toSlug(requestedSlug || name);

  const parsed = organizationSchema.safeParse({
    name,
    slug
  });

  if (!parsed.success) {
    redirectWithError(parsed.error.errors[0]?.message ?? "Dados invalidos.");
  }

  const supabase = await createClient();
  const candidates = [
    parsed.data.slug,
    `${parsed.data.slug}-2`,
    `${parsed.data.slug}-3`,
    `${parsed.data.slug}-${Math.floor(1000 + Math.random() * 9000)}`
  ];

  let lastError = "";

  for (const candidate of candidates) {
    const { error } = await supabase.rpc("create_organization_for_current_user", {
      p_name: parsed.data.name,
      p_slug: candidate
    });

    if (!error) {
      revalidatePath("/", "layout");
      redirect("/dashboard");
    }

    lastError = error.message;
  }

  redirectWithError(
    formatCreateOrganizationError(lastError)
  );
}

export async function saveOnboardingProgressAction(input: {
  currentStep: number;
  completed?: boolean;
  dismissed?: boolean;
}) {
  const user = await requireUser();
  const current = await getCurrentOrganization(user.id);

  if (!current.organization) {
    return { ok: false };
  }

  const now = new Date().toISOString();
  const supabase = await createClient();
  const { error } = await supabase.from("onboarding_progress").upsert(
    {
      organization_id: current.organization.id,
      user_id: user.id,
      current_step: input.currentStep,
      dismissed: Boolean(input.dismissed),
      onboarding_completed_at: input.completed ? now : null,
      updated_at: now
    },
    { onConflict: "organization_id,user_id" }
  );

  if (error) {
    return { ok: false };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}
