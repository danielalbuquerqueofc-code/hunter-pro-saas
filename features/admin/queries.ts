import { getOrganizationAccessState } from "@/features/organizations/access-control";
import { createClient } from "@/lib/supabase/server";

type PlatformOrganizationFilters = {
  q?: string;
  status?: string;
};

export async function getPlatformOrganizations(filters: PlatformOrganizationFilters = {}) {
  const supabase = await createClient();

  const [
    { data: organizations },
    { data: members },
    { data: subscriptions },
    { data: contacts },
    { data: appointments },
    { data: recentAuditLogs }
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("id,name,slug,status,subscription_status,access_status,trial_started_at,trial_ends_at,activated_at,blocked_at,blocked_reason,admin_notes,phone,whatsapp,email,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("organization_members")
      .select("organization_id,id,status")
      .eq("status", "ACTIVE"),
    supabase
      .from("subscriptions")
      .select("organization_id,status,current_period_end,plan:plans(name,price_cents)")
      .order("created_at", { ascending: false }),
    supabase
      .from("contacts")
      .select("organization_id,id"),
    supabase
      .from("appointments")
      .select("organization_id,id"),
    supabase
      .from("audit_logs")
      .select("id,organization_id,action,entity_type,metadata,created_at")
      .order("created_at", { ascending: false })
      .limit(12)
  ]);

  const memberCountByOrganization = new Map<string, number>();
  for (const member of members ?? []) {
    memberCountByOrganization.set(
      member.organization_id,
      (memberCountByOrganization.get(member.organization_id) ?? 0) + 1
    );
  }
  const contactCountByOrganization = new Map<string, number>();
  for (const contact of contacts ?? []) {
    contactCountByOrganization.set(
      contact.organization_id,
      (contactCountByOrganization.get(contact.organization_id) ?? 0) + 1
    );
  }

  const appointmentCountByOrganization = new Map<string, number>();
  for (const appointment of appointments ?? []) {
    appointmentCountByOrganization.set(
      appointment.organization_id,
      (appointmentCountByOrganization.get(appointment.organization_id) ?? 0) + 1
    );
  }

  const latestSubscriptionByOrganization = new Map<string, NonNullable<typeof subscriptions>[number]>();
  for (const subscription of subscriptions ?? []) {
    if (!latestSubscriptionByOrganization.has(subscription.organization_id)) {
      latestSubscriptionByOrganization.set(subscription.organization_id, subscription);
    }
  }

  const normalizedQuery = filters.q?.trim().toLowerCase();

  return {
    organizations: (organizations ?? [])
      .map((organization) => {
        const subscription = latestSubscriptionByOrganization.get(organization.id) ?? null;
        const plan = Array.isArray(subscription?.plan) ? subscription?.plan[0] : subscription?.plan;
        return {
          ...organization,
          access: getOrganizationAccessState(organization),
          subscription,
          plan,
          memberCount: memberCountByOrganization.get(organization.id) ?? 0,
          contactCount: contactCountByOrganization.get(organization.id) ?? 0,
          appointmentCount: appointmentCountByOrganization.get(organization.id) ?? 0
        };
      })
      .filter((organization) => {
        if (filters.status && filters.status !== "all" && organization.access.status !== filters.status) return false;
        if (!normalizedQuery) return true;
        return [
          organization.name,
          organization.slug,
          organization.email,
          organization.phone,
          organization.whatsapp
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));
      }),
    recentAuditLogs: recentAuditLogs ?? []
  };
}
