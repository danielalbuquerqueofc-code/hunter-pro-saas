import { createClient } from "@/lib/supabase/server";

export async function getCurrentOrganization(userId: string) {
  const supabase = await createClient();
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
    role: data?.role ?? null
  };
}
