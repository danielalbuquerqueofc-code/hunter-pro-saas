import { getOrganizationAccessState } from "@/features/organizations/access-control";
import { createClient } from "@/lib/supabase/server";

export async function getPlatformOrganizations() {
  const supabase = await createClient();

  const [
    { data: organizations },
    { data: members },
    { data: recentAuditLogs }
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("id,name,slug,status,subscription_status,access_status,trial_started_at,trial_ends_at,activated_at,blocked_at,blocked_reason,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("organization_members")
      .select("organization_id,id")
      .eq("status", "ACTIVE"),
    supabase
      .from("audit_logs")
      .select("id,organization_id,action,entity_type,metadata,created_at")
      .eq("entity_type", "organization")
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

  return {
    organizations: (organizations ?? []).map((organization) => ({
      ...organization,
      access: getOrganizationAccessState(organization),
      memberCount: memberCountByOrganization.get(organization.id) ?? 0
    })),
    recentAuditLogs: recentAuditLogs ?? []
  };
}
