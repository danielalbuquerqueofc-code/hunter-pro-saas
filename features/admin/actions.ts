"use server";

import { revalidatePath } from "next/cache";
import { assertCanMoveToPlan, getOrganizationPlanUsage } from "@/features/billing/plan-limits";
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

function parseOptionalDate(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const date = new Date(`${text}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseOptionalMoney(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim().replace(/\./g, "").replace(",", ".");
  if (!text) return null;
  const amount = Number(text);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

export async function assignOrganizationPlanAction(formData: FormData) {
  const user = await requireSuperAdmin();
  const supabase = await createClient();
  const organizationId = String(formData.get("organizationId") ?? "");
  const planCode = String(formData.get("planCode") ?? "");
  const changeTiming = String(formData.get("changeTiming") ?? "immediate") === "next_cycle" ? "next_cycle" : "immediate";
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  const trialEndsAt = parseOptionalDate(formData.get("trialEndsAt"));
  const currentPeriodEnd = parseOptionalDate(formData.get("currentPeriodEnd"));
  const courtesyUntil = parseOptionalDate(formData.get("courtesyUntil"));
  const customMonthlyPrice = parseOptionalMoney(formData.get("customMonthlyPrice"));
  const discountPercent = parseOptionalMoney(formData.get("discountPercent"));

  if (!organizationId || !planCode) {
    throw new Error("Empresa e plano sao obrigatorios.");
  }

  const { data: targetPlan, error: planError } = await supabase
    .from("plans")
    .select("id,code,slug,name,description,price_cents,monthly_price,minimum_users,maximum_users,trial_days,status,display_order,is_featured")
    .eq("code", planCode)
    .eq("status", "active")
    .maybeSingle();

  if (planError || !targetPlan) {
    throw new Error("Plano informado nao foi encontrado.");
  }

  const { data: currentSubscription } = await supabase
    .from("subscriptions")
    .select("id,plan_id,plan:plans(name)")
    .eq("organization_id", organizationId)
    .in("status", ["TRIALING", "ACTIVE", "PAST_DUE"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let usage = await getOrganizationPlanUsage(supabase, organizationId);

  try {
    usage = await assertCanMoveToPlan(supabase, organizationId, targetPlan);
  } catch (error) {
    await supabase.from("plan_change_history").insert({
      organization_id: organizationId,
      actor_id: user.id,
      from_plan_id: currentSubscription?.plan_id ?? null,
      to_plan_id: targetPlan.id,
      status: "blocked",
      change_timing: changeTiming,
      used_users: usage.usedSlots,
      target_user_limit: targetPlan.maximum_users,
      reason: error instanceof Error ? error.message : "Downgrade bloqueado por limite de usuarios.",
      metadata: {
        plan_code: targetPlan.code
      }
    });
    throw error;
  }

  if (changeTiming === "immediate") {
    await supabase
      .from("subscriptions")
      .update({ status: "CANCELED", cancel_at_period_end: true, updated_at: new Date().toISOString() })
      .eq("organization_id", organizationId)
      .in("status", ["TRIALING", "ACTIVE", "PAST_DUE"]);

    const subscriptionStatus = trialEndsAt ? "TRIALING" : "ACTIVE";
    const { error: subscriptionError } = await supabase.from("subscriptions").insert({
      organization_id: organizationId,
      plan_id: targetPlan.id,
      status: subscriptionStatus,
      current_period_start: new Date().toISOString(),
      current_period_end: currentPeriodEnd,
      billing_provider: "ASAAS",
      provider_payload: {
        assigned_by_super_admin: true,
        custom_monthly_price: customMonthlyPrice,
        discount_percent: discountPercent,
        courtesy_until: courtesyUntil
      }
    });

    if (subscriptionError) throw new Error(subscriptionError.message);

    await supabase
      .from("organizations")
      .update({
        plan_id: targetPlan.id,
        subscription_status: subscriptionStatus,
        access_status: trialEndsAt ? "trial" : "active",
        trial_ends_at: trialEndsAt,
        updated_at: new Date().toISOString()
      })
      .eq("id", organizationId);
  }

  await supabase.from("plan_change_history").insert({
    organization_id: organizationId,
    actor_id: user.id,
    from_plan_id: currentSubscription?.plan_id ?? null,
    to_plan_id: targetPlan.id,
    status: changeTiming === "immediate" ? "applied" : "pending",
    change_timing: changeTiming,
    used_users: usage.usedSlots,
    target_user_limit: targetPlan.maximum_users,
    custom_monthly_price: customMonthlyPrice,
    discount_percent: discountPercent,
    courtesy_until: courtesyUntil,
    trial_ends_at: trialEndsAt,
    current_period_end: currentPeriodEnd,
    reason: reason || "Plano alterado pelo superadministrador.",
    metadata: {
      plan_code: targetPlan.code,
      billing_provider: "ASAAS",
      asaas_requires_manual_sync: true
    }
  });

  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_id: user.id,
    user_id: user.id,
    action: "billing.plan_assigned",
    entity_type: "plan",
    entity_id: targetPlan.id,
    metadata: {
      plan_code: targetPlan.code,
      change_timing: changeTiming,
      used_users: usage.usedSlots,
      target_user_limit: targetPlan.maximum_users
    }
  });

  revalidatePath("/admin");
  revalidatePath("/plano-assinatura");
  revalidatePath("/", "layout");
}
