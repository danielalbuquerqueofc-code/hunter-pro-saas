import { createClient } from "@/lib/supabase/server";

export type PublicBusyTime = {
  professional_id: string | null;
  starts_at: string;
  ends_at: string;
  kind: "appointment" | "blocked" | "hold";
  occupied_starts_at?: string | null;
  occupied_ends_at?: string | null;
};

export async function getShowcaseByOrganization(organizationId: string) {
  const supabase = await createClient();
  const [{ data: showcase }, { data: links }, { data: gallery }] = await Promise.all([
    supabase.from("showcases").select("*").eq("organization_id", organizationId).maybeSingle(),
    supabase
      .from("showcase_links")
      .select("*")
      .eq("organization_id", organizationId)
      .order("position", { ascending: true }),
    supabase
      .from("showcase_gallery")
      .select("*")
      .eq("organization_id", organizationId)
      .order("position", { ascending: true })
  ]);

  return {
    showcase,
    links: links ?? [],
    gallery: gallery ?? []
  };
}

export async function getPublicShowcase(slug: string) {
  const supabase = await createClient();
  const { data: organization } = await supabase
    .from("organizations")
    .select("id,name,slug,logo_url,cover_url,phone,whatsapp,email,description,address,city,state,timezone,default_appointment_margin_minutes,booking_min_notice_minutes,booking_max_days_ahead,booking_slot_interval_minutes,booking_slot_mode,booking_confirmation_mode")
    .eq("slug", slug)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!organization) return null;

  const nextWindow = new Date();
  nextWindow.setDate(nextWindow.getDate() + 21);

  const [
    { data: showcase },
    { data: links },
    { data: gallery },
    { data: services },
    { data: professionals },
    { data: availabilityRules },
    { data: busyTimes },
    { data: professionalServices }
  ] = await Promise.all([
      supabase
        .from("showcases")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("status", "PUBLISHED")
        .maybeSingle(),
      supabase
        .from("showcase_links")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("is_active", true)
        .order("position", { ascending: true }),
      supabase
        .from("showcase_gallery")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("is_active", true)
        .order("position", { ascending: true }),
      supabase
        .from("services")
        .select("id,name,description,image_url,duration_minutes,price_cents,is_online,margin_before_minutes,margin_after_minutes,booking_min_notice_minutes,booking_max_days_ahead")
        .eq("organization_id", organization.id)
        .eq("is_active", true)
        .order("position", { ascending: true }),
      supabase
        .from("professionals")
        .select("id,name,bio,appointment_margin_minutes,booking_slot_interval_minutes")
        .eq("organization_id", organization.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("availability_rules")
        .select("id,professional_id,weekday,start_time,end_time,is_active,slot_mode")
        .eq("organization_id", organization.id)
        .eq("is_active", true)
        .order("weekday", { ascending: true }),
      supabase.rpc("get_public_busy_times", {
        p_organization_id: organization.id,
        p_until: nextWindow.toISOString()
      }),
      supabase
        .from("professional_services")
        .select("professional_id,service_id")
        .eq("organization_id", organization.id)
    ]);

  return {
    organization,
    showcase,
    links: links ?? [],
    gallery: gallery ?? [],
    services: services ?? [],
    professionals: professionals ?? [],
    availabilityRules: availabilityRules ?? [],
    appointments: ((busyTimes ?? []) as PublicBusyTime[]).filter((item: PublicBusyTime) => item.kind === "appointment"),
    blockedTimes: ((busyTimes ?? []) as PublicBusyTime[]).filter((item: PublicBusyTime) => item.kind === "blocked"),
    holds: ((busyTimes ?? []) as PublicBusyTime[]).filter((item: PublicBusyTime) => item.kind === "hold").map((item: PublicBusyTime) => ({
      id: `${item.professional_id ?? "all"}:${item.starts_at}`,
      professional_id: item.professional_id,
      occupied_starts_at: item.starts_at,
      occupied_ends_at: item.ends_at
    })),
    professionalServices: professionalServices ?? []
  };
}
