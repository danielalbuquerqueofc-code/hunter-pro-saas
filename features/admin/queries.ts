import { getOrganizationAccessState } from "@/features/organizations/access-control";
import { createClient } from "@/lib/supabase/server";

type AdminFilters = {
  q?: string;
  status?: string;
  plan?: string;
  page?: string | number;
};

const PAGE_SIZE = 20;

function normalizePage(value: string | number | undefined) {
  const page = Number(value ?? 1);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function countBy<T extends Record<string, unknown>>(items: T[], key: keyof T) {
  const map = new Map<string, number>();
  for (const item of items) {
    const value = String(item[key] ?? "sem_status");
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
}

export async function getPlatformOrganizations(filters: AdminFilters = {}) {
  const supabase = await createClient();
  const page = normalizePage(filters.page);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [
    { data: organizations, count },
    { data: members },
    { data: pendingInvitations },
    { data: subscriptions },
    { data: plans },
    { data: contacts },
    { data: appointments },
    { data: professionals },
    { data: services },
    { data: recentAuditLogs }
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("id,name,slug,status,subscription_status,access_status,trial_started_at,trial_ends_at,activated_at,blocked_at,blocked_reason,admin_notes,phone,whatsapp,email,logo_url,document,created_at,updated_at,owner:profiles!organizations_owner_id_fkey(id,full_name,phone)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase
      .from("organization_members")
      .select("organization_id,id,status,role,user_id,profile:profiles(id,full_name,phone)"),
    supabase
      .from("organization_invitations")
      .select("organization_id,id")
      .eq("status", "SENT")
      .is("invited_user_id", null)
      .gt("expires_at", new Date().toISOString()),
    supabase
      .from("subscriptions")
      .select("id,organization_id,status,current_period_start,current_period_end,billing_provider,asaas_status,asaas_payment_id,asaas_invoice_url,plan:plans(id,code,slug,name,price_cents,monthly_price,maximum_users,minimum_users,professional_limit,service_limit,appointment_limit,enabled_modules)")
      .order("created_at", { ascending: false }),
    supabase
      .from("plans")
      .select("id,code,slug,name,monthly_price,price_cents,minimum_users,maximum_users,professional_limit,service_limit,appointment_limit,enabled_modules,display_order,status,is_active,is_featured")
      .order("display_order", { ascending: true }),
    supabase.from("contacts").select("organization_id,id"),
    supabase.from("appointments").select("organization_id,id,status,status_v2,created_at"),
    supabase.from("professionals").select("organization_id,id,is_active"),
    supabase.from("services").select("organization_id,id,is_active"),
    supabase
      .from("audit_logs")
      .select("id,organization_id,actor_id,action,entity_type,metadata,reason,created_at")
      .order("created_at", { ascending: false })
      .limit(12)
  ]);

  const memberCountByOrganization = new Map<string, number>();
  const ownersByOrganization = new Map<string, unknown>();
  for (const member of members ?? []) {
    if (member.status === "ACTIVE" || member.status === "PENDING" || member.status === "INVITED") {
      memberCountByOrganization.set(member.organization_id, (memberCountByOrganization.get(member.organization_id) ?? 0) + 1);
    }
    if (member.role === "OWNER" && member.status === "ACTIVE") {
      ownersByOrganization.set(member.organization_id, member.profile);
    }
  }
  for (const invite of pendingInvitations ?? []) {
    memberCountByOrganization.set(invite.organization_id, (memberCountByOrganization.get(invite.organization_id) ?? 0) + 1);
  }

  const countMap = (rows: Array<{ organization_id: string }> | null | undefined) => {
    const map = new Map<string, number>();
    for (const row of rows ?? []) map.set(row.organization_id, (map.get(row.organization_id) ?? 0) + 1);
    return map;
  };

  const contactCountByOrganization = countMap(contacts);
  const appointmentCountByOrganization = countMap(appointments);
  const professionalCountByOrganization = countMap(professionals);
  const serviceCountByOrganization = countMap(services);

  const latestSubscriptionByOrganization = new Map<string, NonNullable<typeof subscriptions>[number]>();
  for (const subscription of subscriptions ?? []) {
    if (!latestSubscriptionByOrganization.has(subscription.organization_id)) {
      latestSubscriptionByOrganization.set(subscription.organization_id, subscription);
    }
  }

  const normalizedQuery = filters.q?.trim().toLowerCase();
  const rows = (organizations ?? [])
    .map((organization) => {
      const subscription = latestSubscriptionByOrganization.get(organization.id) ?? null;
      const plan = Array.isArray(subscription?.plan) ? subscription?.plan[0] : subscription?.plan;
      const owner = ownersByOrganization.get(organization.id) ?? (Array.isArray(organization.owner) ? organization.owner[0] : organization.owner);
      return {
        ...organization,
        owner,
        access: getOrganizationAccessState(organization),
        subscription,
        plan,
        memberCount: memberCountByOrganization.get(organization.id) ?? 0,
        contactCount: contactCountByOrganization.get(organization.id) ?? 0,
        appointmentCount: appointmentCountByOrganization.get(organization.id) ?? 0,
        professionalCount: professionalCountByOrganization.get(organization.id) ?? 0,
        serviceCount: serviceCountByOrganization.get(organization.id) ?? 0
      };
    })
    .filter((organization) => {
      if (filters.status && filters.status !== "all" && organization.access.status !== filters.status) return false;
      if (filters.plan && filters.plan !== "all" && organization.plan?.code !== filters.plan) return false;
      if (!normalizedQuery) return true;
      const owner = organization.owner as { full_name?: string | null; phone?: string | null } | null;
      return [
        organization.id,
        organization.name,
        organization.slug,
        organization.email,
        organization.phone,
        organization.whatsapp,
        organization.document,
        owner?.full_name,
        owner?.phone
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });

  return {
    plans: plans ?? [],
    organizations: rows,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total: count ?? rows.length,
      hasNextPage: (count ?? 0) > page * PAGE_SIZE,
      hasPreviousPage: page > 1
    },
    recentAuditLogs: recentAuditLogs ?? []
  };
}

export async function getAdminDashboard() {
  const supabase = await createClient();
  const trialEndingLimit = new Date();
  trialEndingLimit.setDate(trialEndingLimit.getDate() + 3);

  const [
    { count: totalOrganizations },
    { count: activeOrganizations },
    { count: trialOrganizations },
    { count: trialEnding },
    { count: trialExpired },
    { count: overdue },
    { count: suspended },
    { count: cancelled },
    { count: totalUsers },
    { count: totalProfessionals },
    { count: totalAppointments },
    { data: plans },
    { data: recentAuditLogs },
    { data: subscriptions },
    { data: billingEvents }
  ] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("access_status", "active"),
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("access_status", "trial"),
    supabase
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .eq("access_status", "trial")
      .lte("trial_ends_at", trialEndingLimit.toISOString())
      .gte("trial_ends_at", new Date().toISOString()),
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("access_status", "trial_expired"),
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("subscription_status", "PAST_DUE"),
    supabase.from("organizations").select("id", { count: "exact", head: true }).in("access_status", ["suspended", "blocked"]),
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("access_status", "cancelled"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("professionals").select("id", { count: "exact", head: true }),
    supabase.from("appointments").select("id", { count: "exact", head: true }),
    supabase.from("plans").select("id,code,slug,name,monthly_price,price_cents,minimum_users,maximum_users,professional_limit,service_limit,appointment_limit,enabled_modules,display_order,status,is_active,is_featured").order("display_order", { ascending: true }),
    supabase
      .from("audit_logs")
      .select("id,organization_id,actor_id,action,entity_type,metadata,reason,created_at")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("subscriptions").select("status,organization_id,plan:plans(code,name,monthly_price,price_cents)").in("status", ["TRIALING", "ACTIVE", "PAST_DUE"]),
    supabase.from("billing_events").select("id,status,event_type,created_at").order("created_at", { ascending: false }).limit(8)
  ]);

  const mrr = (subscriptions ?? []).reduce((sum, subscription) => {
    const plan = Array.isArray(subscription.plan) ? subscription.plan[0] : subscription.plan;
    return sum + Number(plan?.monthly_price ?? Number(plan?.price_cents ?? 0) / 100);
  }, 0);

  return {
    metrics: {
      totalOrganizations: totalOrganizations ?? 0,
      activeOrganizations: activeOrganizations ?? 0,
      trialOrganizations: trialOrganizations ?? 0,
      trialEnding: trialEnding ?? 0,
      trialExpired: trialExpired ?? 0,
      overdue: overdue ?? 0,
      suspended: suspended ?? 0,
      cancelled: cancelled ?? 0,
      totalUsers: totalUsers ?? 0,
      totalProfessionals: totalProfessionals ?? 0,
      totalAppointments: totalAppointments ?? 0,
      mrr
    },
    plans: plans ?? [],
    subscriptionsByPlan: countBy((subscriptions ?? []).map((subscription) => {
      const plan = Array.isArray(subscription.plan) ? subscription.plan[0] : subscription.plan;
      return { plan: plan?.name ?? "Sem plano" };
    }), "plan"),
    recentAuditLogs: recentAuditLogs ?? [],
    billingEvents: billingEvents ?? []
  };
}

export async function getAdminOrganizationDetail(id: string) {
  const supabase = await createClient();
  const { data: organization } = await supabase
    .from("organizations")
    .select("*,owner:profiles!organizations_owner_id_fkey(id,full_name,phone,avatar_url)")
    .eq("id", id)
    .maybeSingle();

  if (!organization) return null;

  const [
    { data: members },
    { data: subscriptions },
    { data: plans },
    { data: limitOverrides },
    { data: auditLogs },
    { data: payments },
    { data: countsContacts },
    { data: countsProfessionals },
    { data: countsServices },
    { data: countsAppointments },
    { data: countsTransactions },
    { data: countsNotifications },
    { data: countsIntegrations },
    { data: showcases }
  ] = await Promise.all([
    supabase
      .from("organization_members")
      .select("id,user_id,role,status,created_at,accepted_at,invitation_expires_at,profile:profiles(id,full_name,phone,avatar_url)")
      .eq("organization_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("subscriptions")
      .select("*,plan:plans(*)")
      .eq("organization_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("plans").select("*").eq("is_active", true).order("display_order", { ascending: true }),
    supabase.from("organization_limit_overrides").select("*").eq("organization_id", id).order("created_at", { ascending: false }),
    supabase.from("audit_logs").select("*").eq("organization_id", id).order("created_at", { ascending: false }).limit(30),
    supabase.from("payments").select("*").eq("organization_id", id).order("created_at", { ascending: false }).limit(20),
    supabase.from("contacts").select("id").eq("organization_id", id),
    supabase.from("professionals").select("id").eq("organization_id", id),
    supabase.from("services").select("id").eq("organization_id", id),
    supabase.from("appointments").select("id").eq("organization_id", id),
    supabase.from("financial_transactions").select("id").eq("organization_id", id),
    supabase.from("notifications").select("id").eq("organization_id", id),
    supabase.from("integrations").select("id,status,provider,display_name,last_sync_at").eq("organization_id", id),
    supabase.from("showcases").select("id,title,status,primary_color,hero_image_url,updated_at").eq("organization_id", id).maybeSingle()
  ]);

  const latestSubscription = subscriptions?.[0] ?? null;
  const plan = Array.isArray(latestSubscription?.plan) ? latestSubscription?.plan[0] : latestSubscription?.plan;

  return {
    organization: {
      ...organization,
      access: getOrganizationAccessState(organization),
      plan,
      subscription: latestSubscription
    },
    members: members ?? [],
    subscriptions: subscriptions ?? [],
    plans: plans ?? [],
    limitOverrides: limitOverrides ?? [],
    auditLogs: auditLogs ?? [],
    payments: payments ?? [],
    integrations: countsIntegrations ?? [],
    showcase: showcases ?? null,
    counts: {
      users: members?.length ?? 0,
      professionals: countsProfessionals?.length ?? 0,
      services: countsServices?.length ?? 0,
      clients: countsContacts?.length ?? 0,
      appointments: countsAppointments?.length ?? 0,
      transactions: countsTransactions?.length ?? 0,
      notifications: countsNotifications?.length ?? 0,
      integrations: countsIntegrations?.length ?? 0
    }
  };
}

export async function getAdminUsers() {
  const supabase = await createClient();
  const [{ data: profiles }, { data: members }, { data: invitations }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,phone,avatar_url,is_super_admin,created_at").order("created_at", { ascending: false }).limit(200),
    supabase
      .from("organization_members")
      .select("id,user_id,role,status,created_at,organization:organizations(id,name,slug)")
      .order("created_at", { ascending: false }),
    supabase
      .from("organization_invitations")
      .select("id,email,role,status,created_at,organization:organizations(id,name,slug)")
      .order("created_at", { ascending: false })
      .limit(100)
  ]);

  return {
    profiles: profiles ?? [],
    members: members ?? [],
    invitations: invitations ?? []
  };
}

export async function getAdminPlans() {
  const supabase = await createClient();
  const [{ data: plans }, { data: subscriptions }] = await Promise.all([
    supabase.from("plans").select("*").order("display_order", { ascending: true }),
    supabase.from("subscriptions").select("plan_id,id,status")
  ]);

  const subscriptionCount = new Map<string, number>();
  for (const subscription of subscriptions ?? []) {
    if (subscription.plan_id) subscriptionCount.set(subscription.plan_id, (subscriptionCount.get(subscription.plan_id) ?? 0) + 1);
  }

  return (plans ?? []).map((plan) => ({
    ...plan,
    subscriptionCount: subscriptionCount.get(plan.id) ?? 0
  }));
}

export async function getAdminSubscriptionsAndPayments() {
  const supabase = await createClient();
  const [{ data: subscriptions }, { data: payments }, { data: billingEvents }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*,organization:organizations(id,name,slug),plan:plans(id,name,code,monthly_price,price_cents)")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("payments")
      .select("*,organization:organizations(id,name,slug),subscription:subscriptions(id,status)")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("billing_events")
      .select("*,organization:organizations(id,name,slug)")
      .order("created_at", { ascending: false })
      .limit(100)
  ]);

  return {
    subscriptions: subscriptions ?? [],
    payments: payments ?? [],
    billingEvents: billingEvents ?? []
  };
}

export async function getAdminAuditLogs() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("*,organization:organizations(id,name,slug),actor:profiles!audit_logs_actor_id_fkey(id,full_name)")
    .order("created_at", { ascending: false })
    .limit(150);

  return data ?? [];
}
