import { createClient } from "@/lib/supabase/server";

export async function getAgendaData(organizationId: string) {
  const supabase = await createClient();
  const [{ data: professionals }, { data: rules }, { data: appointments }, { data: blockedTimes }, { data: integrations }] = await Promise.all([
    supabase
      .from("professionals")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true }),
    supabase
      .from("availability_rules")
      .select("*, professional:professionals(name)")
      .eq("organization_id", organizationId)
      .order("weekday", { ascending: true }),
    supabase
      .from("appointments")
      .select("*, service:services(name), professional:professionals(name)")
      .eq("organization_id", organizationId)
      .order("starts_at", { ascending: true })
      .limit(50),
    supabase
      .from("blocked_times")
      .select("*, professional:professionals(name)")
      .eq("organization_id", organizationId)
      .order("starts_at", { ascending: true })
      .limit(20),
    supabase
      .from("integrations")
      .select("*")
      .eq("organization_id", organizationId)
      .in("provider", ["WHATSAPP", "GOOGLE_CALENDAR"])
  ]);

  return {
    professionals: professionals ?? [],
    rules: rules ?? [],
    appointments: appointments ?? [],
    blockedTimes: blockedTimes ?? [],
    integrations: integrations ?? []
  };
}
