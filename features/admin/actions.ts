"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type AdminAction = "activate" | "block" | "unblock" | "extend_trial" | "expire_trial" | "cancel";

function normalizeAdminAction(value: FormDataEntryValue | null): AdminAction {
  const action = String(value ?? "");
  if (
    action === "activate" ||
    action === "block" ||
    action === "unblock" ||
    action === "extend_trial" ||
    action === "expire_trial" ||
    action === "cancel"
  ) {
    return action;
  }

  throw new Error("Acao administrativa invalida.");
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export async function updateOrganizationAccessAction(formData: FormData) {
  const user = await requireSuperAdmin();
  const supabase = await createClient();
  const organizationId = String(formData.get("organizationId") ?? "");
  const action = normalizeAdminAction(formData.get("action"));
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  const now = new Date();

  if (!organizationId) {
    throw new Error("Empresa nao informada.");
  }

  const updates: Record<string, string | null> = {
    updated_at: now.toISOString()
  };

  if (action === "activate" || action === "unblock") {
    updates.access_status = "active";
    updates.status = "ACTIVE";
    updates.subscription_status = "ACTIVE";
    updates.activated_at = now.toISOString();
    updates.blocked_at = null;
    updates.blocked_by = null;
    updates.blocked_reason = null;
  }

  if (action === "block") {
    updates.access_status = "blocked";
    updates.status = "SUSPENDED";
    updates.blocked_at = now.toISOString();
    updates.blocked_by = user.id;
    updates.blocked_reason = reason || "Bloqueio administrativo.";
  }

  if (action === "extend_trial") {
    updates.access_status = "trial";
    updates.status = "ACTIVE";
    updates.subscription_status = "TRIALING";
    updates.trial_ends_at = addDays(now, 5).toISOString();
    updates.blocked_at = null;
    updates.blocked_by = null;
    updates.blocked_reason = null;
  }

  if (action === "expire_trial") {
    updates.access_status = "trial_expired";
    updates.status = "SUSPENDED";
    updates.subscription_status = "PAST_DUE";
    updates.blocked_at = now.toISOString();
    updates.blocked_by = user.id;
    updates.blocked_reason = reason || "Periodo gratis encerrado.";
  }

  if (action === "cancel") {
    updates.access_status = "cancelled";
    updates.status = "CANCELED";
    updates.subscription_status = "CANCELED";
    updates.blocked_at = now.toISOString();
    updates.blocked_by = user.id;
    updates.blocked_reason = reason || "Conta cancelada administrativamente.";
  }

  const { error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", organizationId);

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_id: user.id,
    user_id: user.id,
    action: `organization.${action}`,
    entity_type: "organization",
    entity_id: organizationId,
    metadata: {
      action,
      reason,
      updates
    }
  });

  await supabase.from("notifications").insert({
    organization_id: organizationId,
    user_id: null,
    status: "UNREAD",
    type: "organization_access",
    title: "Acesso da empresa atualizado",
    body: reason || "A administracao atualizou o status de acesso da empresa.",
    message: reason || "A administracao atualizou o status de acesso da empresa.",
    action_url: "/dashboard"
  });

  revalidatePath("/admin");
  revalidatePath("/", "layout");
}
