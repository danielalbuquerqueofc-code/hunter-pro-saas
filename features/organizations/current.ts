import { createClient } from "@/lib/supabase/server";

export async function getCurrentOrganization(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_members")
    .select("role, organization:organizations(id,name,slug,status,subscription_status,access_status,trial_started_at,trial_ends_at,activated_at,blocked_at,blocked_reason)")
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const organization = Array.isArray(data?.organization)
    ? data?.organization[0]
    : data?.organization;

  return {
    organization: organization ?? null,
    role: data?.role ?? null
  };
}
