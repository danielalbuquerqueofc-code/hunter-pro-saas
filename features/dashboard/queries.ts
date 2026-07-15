import { createClient } from "@/lib/supabase/server";

export async function getDashboardData(userId: string) {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, organization:organizations(id,name,slug)")
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const organization = Array.isArray(membership?.organization)
    ? membership?.organization[0]
    : membership?.organization;

  if (!organization) {
    return {
      organization: null,
      role: null,
      stats: {
        members: 0,
        activePlan: "Sem plano",
        status: "Pendente",
        publicUrl: "-"
      }
    };
  }

  const [{ count: members }, { data: subscription }] = await Promise.all([
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
      .maybeSingle()
  ]);

  const plan = Array.isArray(subscription?.plan) ? subscription?.plan[0] : subscription?.plan;

  return {
    organization,
    role: membership?.role ?? null,
    stats: {
      members: members ?? 0,
      activePlan: plan?.name ?? "Free",
      status: subscription?.status ?? "ACTIVE",
      publicUrl: `/p/${organization.slug}`
    }
  };
}
