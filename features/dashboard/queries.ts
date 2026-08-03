import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/features/organizations/current";

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function startOfMonth(date: Date) {
  const copy = new Date(date.getFullYear(), date.getMonth(), 1);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getDashboardData(userId: string) {
  const supabase = await createClient();

  const current = await getCurrentOrganization(userId);
  const organization = current.organization;

  if (!organization) {
    return {
      organization: null,
      role: null,
      impersonation: null,
      stats: {
        members: 0,
        activePlan: "Sem plano",
        status: "Pendente",
        publicUrl: "-"
      },
      operations: null
    };
  }

  const now = new Date();
  const todayStart = startOfDay(now).toISOString();
  const todayEnd = endOfDay(now).toISOString();
  const monthStart = startOfMonth(now).toISOString();

  const [
    { count: members },
    { data: subscription },
    { count: contactsThisMonth },
    { data: contacts },
    { data: appointmentsToday },
    { data: upcomingAppointments },
    { data: deals },
    { data: transactions },
    { data: tasks },
    { data: activities },
    { data: stages },
    { data: aiAgents }
  ] = await Promise.all([
    supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id),
    supabase
      .from("subscriptions")
      .select("status, plan:plans(name)")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .gte("created_at", monthStart),
    supabase
      .from("contacts")
      .select("id,name,phone,email,status,type,created_at")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("appointments")
      .select("id,customer_name,customer_phone,status,starts_at,service:services(name,price_cents),professional:professionals(name)")
      .eq("organization_id", organization.id)
      .gte("starts_at", todayStart)
      .lte("starts_at", todayEnd)
      .order("starts_at", { ascending: true })
      .limit(12),
    supabase
      .from("appointments")
      .select("id,customer_name,status,starts_at,service:services(name),professional:professionals(name)")
      .eq("organization_id", organization.id)
      .gte("starts_at", now.toISOString())
      .order("starts_at", { ascending: true })
      .limit(12),
    supabase
      .from("deals")
      .select("id,title,status,stage_id,value_cents,created_at")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("financial_transactions")
      .select("id,type,status,payment_method,amount_cents,due_date,paid_at,created_at")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("tasks")
      .select("id,title,priority,status,due_at,created_at")
      .eq("organization_id", organization.id)
      .order("due_at", { ascending: true })
      .limit(12),
    supabase
      .from("deal_activities")
      .select("id,title,type,created_at")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("pipeline_stages")
      .select("id,name,position")
      .eq("organization_id", organization.id)
      .order("position", { ascending: true }),
    supabase
      .from("ai_agents")
      .select("id,status")
      .eq("organization_id", organization.id)
  ]);

  const plan = Array.isArray(subscription?.plan) ? subscription?.plan[0] : subscription?.plan;
  const safeDeals = deals ?? [];
  const safeTransactions = transactions ?? [];
  const safeTasks = tasks ?? [];
  const openDeals = safeDeals.filter((deal) => deal.status === "OPEN");
  const wonDeals = safeDeals.filter((deal) => deal.status === "WON").length;
  const closedDeals = safeDeals.filter((deal) => ["WON", "LOST"].includes(String(deal.status))).length;
  const conversionRate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 0;
  const paidIncome = safeTransactions
    .filter((item) => item.type === "INCOME" && item.status === "PAID")
    .reduce((sum, item) => sum + Number(item.amount_cents ?? 0), 0);
  const paidExpense = safeTransactions
    .filter((item) => item.type === "EXPENSE" && item.status === "PAID")
    .reduce((sum, item) => sum + Number(item.amount_cents ?? 0), 0);
  const pendingReceivable = safeTransactions
    .filter((item) => item.type === "INCOME" && item.status === "PENDING")
    .reduce((sum, item) => sum + Number(item.amount_cents ?? 0), 0);
  const pendingPayable = safeTransactions
    .filter((item) => item.type === "EXPENSE" && item.status === "PENDING")
    .reduce((sum, item) => sum + Number(item.amount_cents ?? 0), 0);
  const overdueTasks = safeTasks.filter((task) =>
    task.status !== "DONE" && task.due_at && new Date(task.due_at) < now
  );
  const paidByMethod = safeTransactions
    .filter((item) => item.type === "INCOME" && item.status === "PAID")
    .reduce<Record<string, number>>((acc, item) => {
      const key = String(item.payment_method ?? "Nao informado");
      acc[key] = (acc[key] ?? 0) + Number(item.amount_cents ?? 0);
      return acc;
    }, {});
  const dealsByStage = (stages ?? []).map((stage) => ({
    label: stage.name,
    count: openDeals.filter((deal) => deal.stage_id === stage.id).length
  }));

  return {
    organization,
    role: current.role ?? null,
    impersonation: current.impersonation ?? null,
    stats: {
      members: members ?? 0,
      activePlan: plan?.name ?? "Free",
      status: subscription?.status ?? "ACTIVE",
      accessStatus: organization.access_status ?? "active",
      trialEndsAt: organization.trial_ends_at ?? null,
      publicUrl: `/p/${organization.slug}`
    },
    operations: {
      contacts: contacts ?? [],
      contactsThisMonth: contactsThisMonth ?? 0,
      appointmentsToday: (appointmentsToday ?? []).map((appointment) => ({
        ...appointment,
        service: normalizeRelation(appointment.service),
        professional: normalizeRelation(appointment.professional)
      })),
      upcomingAppointments: (upcomingAppointments ?? []).map((appointment) => ({
        ...appointment,
        service: normalizeRelation(appointment.service),
        professional: normalizeRelation(appointment.professional)
      })),
      openDeals,
      conversionRate,
      financial: {
        paidIncome,
        paidExpense,
        pendingReceivable,
        pendingPayable,
        balance: paidIncome - paidExpense
      },
      paidByMethod,
      tasks: safeTasks,
      overdueTasks: overdueTasks.length,
      activities: activities ?? [],
      pipeline: dealsByStage,
      aiAgents: aiAgents ?? []
    }
  };
}
