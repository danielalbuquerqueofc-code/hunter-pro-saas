"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { assertCanMoveToPlan, getOrganizationPlanUsage } from "@/features/billing/plan-limits";
import { requireSuperAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/constants/roles";

type AdminAction = "activate" | "suspend" | "block" | "unblock" | "extend_trial" | "expire_trial" | "cancel" | "reactivate";
const COMPANY_ROLES: Role[] = ["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT", "PROFESSIONAL", "FINANCIAL"];
const MEMBER_STATUSES = ["PENDING", "ACTIVE", "SUSPENDED", "REMOVED"] as const;

function normalizeAdminAction(value: FormDataEntryValue | null): AdminAction {
  const action = String(value ?? "");
  if (
    action === "activate" ||
    action === "suspend" ||
    action === "block" ||
    action === "unblock" ||
    action === "extend_trial" ||
    action === "expire_trial" ||
    action === "cancel" ||
    action === "reactivate"
  ) {
    return action;
  }

  throw new Error("Acao administrativa invalida.");
}

function normalizeRole(value: FormDataEntryValue | null): Role {
  const role = String(value ?? "");
  if (COMPANY_ROLES.includes(role as Role)) return role as Role;
  throw new Error("Perfil invalido.");
}

function normalizeMemberStatus(value: FormDataEntryValue | null) {
  const status = String(value ?? "");
  if (MEMBER_STATUSES.includes(status as (typeof MEMBER_STATUSES)[number])) return status;
  throw new Error("Status invalido.");
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

  const { data: before } = await supabase
    .from("organizations")
    .select("id,status,subscription_status,access_status,trial_ends_at,blocked_at,blocked_reason,plan_id,owner_id")
    .eq("id", organizationId)
    .maybeSingle();

  if (!before) {
    throw new Error("Empresa nao encontrada.");
  }

  if (action === "activate" || action === "unblock" || action === "reactivate") {
    updates.access_status = "active";
    updates.status = "ACTIVE";
    updates.subscription_status = "ACTIVE";
    updates.activated_at = now.toISOString();
    updates.blocked_at = null;
    updates.blocked_by = null;
    updates.blocked_reason = null;
  }

  if (action === "suspend") {
    updates.access_status = "suspended";
    updates.status = "SUSPENDED";
    updates.blocked_at = now.toISOString();
    updates.blocked_by = user.id;
    updates.blocked_reason = reason || "Acesso suspenso administrativamente.";
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
      previous_values: before,
      new_values: updates
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
  revalidatePath(`/admin/empresas/${organizationId}`);
  revalidatePath("/admin/empresas");
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
  revalidatePath(`/admin/empresas/${organizationId}`);
  revalidatePath("/admin/empresas");
  revalidatePath("/admin/assinaturas");
  revalidatePath("/plano-assinatura");
  revalidatePath("/", "layout");
}

export async function upsertPlanAction(formData: FormData) {
  const user = await requireSuperAdmin();
  const supabase = await createClient();
  const planId = String(formData.get("planId") ?? "");
  const code = String(formData.get("code") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const monthlyPrice = parseOptionalMoney(formData.get("monthlyPrice")) ?? 0;
  const minimumUsers = Number(formData.get("minimumUsers") ?? 1);
  const maximumUsers = Number(formData.get("maximumUsers") ?? 1);
  const professionalLimit = Number(formData.get("professionalLimit") ?? 0) || null;
  const serviceLimit = Number(formData.get("serviceLimit") ?? 0) || null;
  const appointmentLimit = Number(formData.get("appointmentLimit") ?? 0) || null;
  const trialDays = Number(formData.get("trialDays") ?? 7);
  const status = String(formData.get("status") ?? "active") === "inactive" ? "inactive" : "active";
  const isFeatured = String(formData.get("isFeatured") ?? "") === "on";

  if (!code || !name || maximumUsers < minimumUsers) {
    throw new Error("Dados do plano invalidos.");
  }

  const payload = {
    code,
    slug: code,
    name,
    description: String(formData.get("description") ?? "").trim() || null,
    price_cents: Math.round(monthlyPrice * 100),
    monthly_price: monthlyPrice,
    minimum_users: minimumUsers,
    maximum_users: maximumUsers,
    professional_limit: professionalLimit,
    service_limit: serviceLimit,
    appointment_limit: appointmentLimit,
    trial_days: trialDays,
    status,
    is_active: status === "active",
    is_featured: isFeatured,
    display_order: Number(formData.get("displayOrder") ?? 0),
    enabled_modules: String(formData.get("enabledModules") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    updated_at: new Date().toISOString()
  };

  const query = planId
    ? supabase.from("plans").update(payload).eq("id", planId).select("id").single()
    : supabase.from("plans").insert(payload).select("id").single();

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    user_id: user.id,
    action: planId ? "plan.updated" : "plan.created",
    entity_type: "plan",
    entity_id: data.id,
    reason: String(formData.get("reason") ?? "").trim() || "Plano alterado pelo superadministrador.",
    metadata: payload
  });

  revalidatePath("/admin/planos");
  revalidatePath("/admin");
}

export async function updateAdminMemberAction(formData: FormData) {
  const user = await requireSuperAdmin();
  const supabase = await createClient();
  const organizationId = String(formData.get("organizationId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  const role = normalizeRole(formData.get("role"));
  const status = normalizeMemberStatus(formData.get("status"));
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);

  const { data: member } = await supabase
    .from("organization_members")
    .select("id,user_id,role,status,organization_id")
    .eq("id", memberId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!member) throw new Error("Membro nao encontrado.");

  if (member.role === "OWNER" && (role !== "OWNER" || status !== "ACTIVE")) {
    const { count } = await supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("role", "OWNER")
      .eq("status", "ACTIVE");
    if ((count ?? 0) <= 1) {
      throw new Error("Este usuario nao pode ser removido porque e o unico proprietario.");
    }
  }

  const { error } = await supabase
    .from("organization_members")
    .update({
      role,
      status,
      removed_at: status === "REMOVED" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq("id", memberId)
    .eq("organization_id", organizationId);

  if (error) throw new Error(error.message);

  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_id: user.id,
    user_id: user.id,
    target_user_id: member.user_id,
    action: "admin.member.updated",
    entity_type: "organization_member",
    entity_id: member.id,
    previous_values: { role: member.role, status: member.status },
    new_values: { role, status },
    reason: reason || "Membro atualizado pelo superadministrador."
  });

  revalidatePath(`/admin/empresas/${organizationId}`);
  revalidatePath("/admin/usuarios");
}

export async function transferOrganizationOwnerAction(formData: FormData) {
  const user = await requireSuperAdmin();
  const supabase = await createClient();
  const organizationId = String(formData.get("organizationId") ?? "");
  const newOwnerMemberId = String(formData.get("newOwnerMemberId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);

  const { data: newOwner } = await supabase
    .from("organization_members")
    .select("id,user_id,role,status")
    .eq("id", newOwnerMemberId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!newOwner || newOwner.status !== "ACTIVE") {
    throw new Error("Escolha um membro ativo para receber a propriedade.");
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("id,owner_id")
    .eq("id", organizationId)
    .maybeSingle();

  if (!organization) throw new Error("Empresa nao encontrada.");

  await supabase.from("organization_members").update({ role: "ADMIN" }).eq("organization_id", organizationId).eq("role", "OWNER");
  const { error } = await supabase.from("organization_members").update({ role: "OWNER", status: "ACTIVE" }).eq("id", newOwnerMemberId);
  if (error) throw new Error(error.message);

  await supabase.from("organizations").update({ owner_id: newOwner.user_id, updated_at: new Date().toISOString() }).eq("id", organizationId);

  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_id: user.id,
    user_id: user.id,
    target_user_id: newOwner.user_id,
    action: "admin.organization.owner_transferred",
    entity_type: "organization",
    entity_id: organizationId,
    previous_values: { owner_id: organization.owner_id },
    new_values: { owner_id: newOwner.user_id },
    reason: reason || "Propriedade transferida pelo superadministrador."
  });

  revalidatePath(`/admin/empresas/${organizationId}`);
  revalidatePath("/admin/empresas");
}

export async function createLimitOverrideAction(formData: FormData) {
  const user = await requireSuperAdmin();
  const supabase = await createClient();
  const organizationId = String(formData.get("organizationId") ?? "");
  const limitKey = String(formData.get("limitKey") ?? "");
  const limitValue = Number(formData.get("limitValue") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim();
  const expiresAt = parseOptionalDate(formData.get("expiresAt"));

  if (!organizationId || !["users", "professionals", "services", "appointments", "storage_mb"].includes(limitKey) || limitValue < 0 || !reason) {
    throw new Error("Dados da excecao de limite invalidos.");
  }

  const { data, error } = await supabase.from("organization_limit_overrides").insert({
    organization_id: organizationId,
    limit_key: limitKey,
    limit_value: limitValue,
    reason,
    expires_at: expiresAt,
    created_by: user.id
  }).select("id").single();

  if (error) throw new Error(error.message);

  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_id: user.id,
    user_id: user.id,
    action: "admin.limit_override.created",
    entity_type: "organization_limit_override",
    entity_id: data.id,
    reason,
    new_values: { limitKey, limitValue, expiresAt }
  });

  revalidatePath(`/admin/empresas/${organizationId}`);
}

export async function createManualPaymentAction(formData: FormData) {
  const user = await requireSuperAdmin();
  const supabase = await createClient();
  const organizationId = String(formData.get("organizationId") ?? "");
  const subscriptionId = String(formData.get("subscriptionId") ?? "") || null;
  const amount = parseOptionalMoney(formData.get("amount")) ?? 0;
  const status = String(formData.get("status") ?? "paid");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!organizationId || amount < 0 || !["pending", "paid", "overdue", "cancelled", "refunded", "failed"].includes(status) || !reason) {
    throw new Error("Dados do pagamento manual invalidos.");
  }

  const { data, error } = await supabase.from("payments").insert({
    organization_id: organizationId,
    subscription_id: subscriptionId,
    provider: "MANUAL",
    amount_cents: Math.round(amount * 100),
    status,
    due_date: String(formData.get("dueDate") ?? "") || null,
    paid_at: status === "paid" ? new Date().toISOString() : null,
    payment_method: String(formData.get("paymentMethod") ?? "manual"),
    notes: reason,
    created_by: user.id
  }).select("id").single();

  if (error) throw new Error(error.message);

  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_id: user.id,
    user_id: user.id,
    action: "admin.payment.manual_created",
    entity_type: "payment",
    entity_id: data.id,
    reason,
    new_values: { amount, status }
  });

  revalidatePath("/admin/pagamentos");
  revalidatePath(`/admin/empresas/${organizationId}`);
}

export async function startImpersonationAction(formData: FormData) {
  const user = await requireSuperAdmin();
  const supabase = await createClient();
  const headerStore = await headers();
  const cookieStore = await cookies();
  const organizationId = String(formData.get("organizationId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);

  if (!organizationId || !reason) {
    throw new Error("Informe empresa e motivo para visualizar como empresa.");
  }

  const { data, error } = await supabase.from("admin_impersonation_sessions").insert({
    organization_id: organizationId,
    super_admin_id: user.id,
    reason,
    user_agent: headerStore.get("user-agent")
  }).select("id").single();

  if (error) throw new Error(error.message);

  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_id: user.id,
    user_id: user.id,
    action: "admin.impersonation.started",
    entity_type: "admin_impersonation_session",
    entity_id: data.id,
    reason
  });

  cookieStore.set("hunter_impersonation_session", data.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 30
  });

  revalidatePath(`/admin/empresas/${organizationId}`);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function endImpersonationAction(formData: FormData) {
  const user = await requireSuperAdmin();
  const supabase = await createClient();
  const cookieStore = await cookies();
  const sessionId = String(formData.get("sessionId") ?? cookieStore.get("hunter_impersonation_session")?.value ?? "");
  const organizationId = String(formData.get("organizationId") ?? "");

  if (!sessionId) {
    throw new Error("Sessao de suporte nao encontrada.");
  }

  const { error } = await supabase
    .from("admin_impersonation_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("super_admin_id", user.id);

  if (error) throw new Error(error.message);

  await supabase.from("audit_logs").insert({
    organization_id: organizationId || null,
    actor_id: user.id,
    user_id: user.id,
    action: "admin.impersonation.ended",
    entity_type: "admin_impersonation_session",
    entity_id: sessionId
  });

  cookieStore.delete("hunter_impersonation_session");

  revalidatePath(organizationId ? `/admin/empresas/${organizationId}` : "/admin");
  revalidatePath("/dashboard");
  redirect(organizationId ? `/admin/empresas/${organizationId}` : "/admin");
}
