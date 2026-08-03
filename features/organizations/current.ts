import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function getCurrentOrganization(userId: string) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const impersonationSessionId = cookieStore.get("hunter_impersonation_session")?.value;

  if (impersonationSessionId) {
    const [{ data: profile }, { data: session }] = await Promise.all([
      supabase.from("profiles").select("is_super_admin").eq("id", userId).maybeSingle(),
      supabase
        .from("admin_impersonation_sessions")
        .select("id,organization_id,reason,expires_at,organization:organizations(id,name,slug,status,subscription_status,access_status,trial_started_at,trial_ends_at,activated_at,blocked_at,blocked_reason,timezone,default_appointment_margin_minutes,booking_min_notice_minutes,booking_max_days_ahead,booking_slot_interval_minutes,booking_slot_mode,booking_confirmation_mode,quiet_hours_start,quiet_hours_end,quiet_hours_policy,phone,whatsapp,document,billing_phone,billing_provider,asaas_customer_id)")
        .eq("id", impersonationSessionId)
        .eq("super_admin_id", userId)
        .is("ended_at", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle()
    ]);

    const organization = Array.isArray(session?.organization)
      ? session?.organization[0]
      : session?.organization;

    if (profile?.is_super_admin && session && organization) {
      return {
        organization,
        role: "SUPER_ADMIN",
        impersonation: {
          sessionId: session.id,
          organizationId: session.organization_id,
          reason: session.reason,
          expiresAt: session.expires_at
        }
      };
    }
  }

  const { data } = await supabase
    .from("organization_members")
    .select("role, organization:organizations(id,name,slug,status,subscription_status,access_status,trial_started_at,trial_ends_at,activated_at,blocked_at,blocked_reason,timezone,default_appointment_margin_minutes,booking_min_notice_minutes,booking_max_days_ahead,booking_slot_interval_minutes,booking_slot_mode,booking_confirmation_mode,quiet_hours_start,quiet_hours_end,quiet_hours_policy,phone,whatsapp,document,billing_phone,billing_provider,asaas_customer_id)")
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
    role: data?.role ?? null,
    impersonation: null
  };
}
