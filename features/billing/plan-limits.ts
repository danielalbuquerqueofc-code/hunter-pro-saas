import type { SupabaseClient } from "@supabase/supabase-js";

type PlanRow = {
  id: string;
  code: string;
  slug: string | null;
  name: string;
  description: string | null;
  price_cents: number;
  monthly_price: number | null;
  minimum_users: number;
  maximum_users: number;
  trial_days: number;
  status: string;
  display_order: number;
  is_featured: boolean;
};

type SubscriptionWithPlan = {
  plan_id: string;
  status: string;
  plan: PlanRow | PlanRow[] | null;
};

export type PlanUsage = {
  plan: PlanRow;
  activeMembers: number;
  pendingInvitations: number;
  usedSlots: number;
  availableSlots: number;
  maximumUsers: number;
  minimumUsers: number;
};

export function formatPlanPrice(plan: Pick<PlanRow, "monthly_price" | "price_cents">) {
  const value = plan.monthly_price ?? Number(plan.price_cents ?? 0) / 100;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function getPlanLimitMessage(plan: Pick<PlanRow, "slug" | "code" | "name" | "maximum_users">) {
  const code = plan.slug ?? plan.code;
  if (code === "start") {
    return "Seu plano Start permite apenas 1 usuario. Faca upgrade para o plano Pro para adicionar outro membro a equipe.";
  }
  if (code === "pro") {
    return "Seu plano Pro permite ate 2 usuarios. Faca upgrade para o plano Scale para adicionar mais membros.";
  }
  return `Seu plano ${plan.name} permite ate ${plan.maximum_users} usuarios. Para adicionar mais usuarios, entre em contato com o suporte.`;
}

export function getDowngradeBlockedMessage(usedSlots: number, maximumUsers: number) {
  const excess = Math.max(usedSlots - maximumUsers, 0);
  return `Este plano permite ate ${maximumUsers} usuarios, mas sua empresa possui ${usedSlots} usuarios ocupando vagas. Desative ${excess} usuario${excess === 1 ? "" : "s"} antes de concluir o downgrade.`;
}

async function getFallbackStartPlan(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("plans")
    .select("id,code,slug,name,description,price_cents,monthly_price,minimum_users,maximum_users,trial_days,status,display_order,is_featured")
    .eq("code", "start")
    .maybeSingle<PlanRow>();

  if (error || !data) {
    throw new Error("Plano Start nao encontrado. Rode a migration 0014 dos planos comerciais.");
  }

  return data;
}

export async function getPlanByCode(supabase: SupabaseClient, code: string) {
  const { data, error } = await supabase
    .from("plans")
    .select("id,code,slug,name,description,price_cents,monthly_price,minimum_users,maximum_users,trial_days,status,display_order,is_featured")
    .eq("code", code)
    .eq("status", "active")
    .maybeSingle<PlanRow>();

  if (error) throw new Error(error.message);
  return data;
}

export async function getCurrentPlan(supabase: SupabaseClient, organizationId: string) {
  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("plan_id,status,plan:plans(id,code,slug,name,description,price_cents,monthly_price,minimum_users,maximum_users,trial_days,status,display_order,is_featured)")
    .eq("organization_id", organizationId)
    .in("status", ["TRIALING", "ACTIVE", "PAST_DUE"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionWithPlan>();

  if (subscriptionError) throw new Error(subscriptionError.message);

  const subscriptionPlan = Array.isArray(subscription?.plan) ? subscription?.plan[0] : subscription?.plan;
  if (subscriptionPlan) return subscriptionPlan;

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("plan:plans(id,code,slug,name,description,price_cents,monthly_price,minimum_users,maximum_users,trial_days,status,display_order,is_featured)")
    .eq("id", organizationId)
    .maybeSingle<{ plan: PlanRow | PlanRow[] | null }>();

  if (organizationError) throw new Error(organizationError.message);

  const organizationPlan = Array.isArray(organization?.plan) ? organization?.plan[0] : organization?.plan;
  return organizationPlan ?? getFallbackStartPlan(supabase);
}

export async function getOrganizationPlanUsage(supabase: SupabaseClient, organizationId: string): Promise<PlanUsage> {
  const [plan, activeMembersResult, pendingInvitationsResult] = await Promise.all([
    getCurrentPlan(supabase, organizationId),
    supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("status", ["ACTIVE", "INVITED"]),
    supabase
      .from("organization_invitations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "SENT")
      .is("invited_user_id", null)
      .gt("expires_at", new Date().toISOString())
  ]);

  if (activeMembersResult.error) throw new Error(activeMembersResult.error.message);
  if (pendingInvitationsResult.error) throw new Error(pendingInvitationsResult.error.message);

  const activeMembers = activeMembersResult.count ?? 0;
  const pendingInvitations = pendingInvitationsResult.count ?? 0;
  const usedSlots = activeMembers + pendingInvitations;
  const maximumUsers = Number(plan.maximum_users ?? 1);

  return {
    plan,
    activeMembers,
    pendingInvitations,
    usedSlots,
    availableSlots: Math.max(maximumUsers - usedSlots, 0),
    maximumUsers,
    minimumUsers: Number(plan.minimum_users ?? 1)
  };
}

export async function assertCanAddOrganizationUser(supabase: SupabaseClient, organizationId: string) {
  const usage = await getOrganizationPlanUsage(supabase, organizationId);
  if (usage.usedSlots >= usage.maximumUsers) {
    throw new Error(getPlanLimitMessage(usage.plan));
  }
  return usage;
}

export async function assertCanMoveToPlan(supabase: SupabaseClient, organizationId: string, targetPlan: PlanRow) {
  const usage = await getOrganizationPlanUsage(supabase, organizationId);
  if (usage.usedSlots > targetPlan.maximum_users) {
    throw new Error(getDowngradeBlockedMessage(usage.usedSlots, targetPlan.maximum_users));
  }
  return usage;
}
