import { createClient } from "@/lib/supabase/server";

export async function getCrmData(organizationId: string) {
  const supabase = await createClient();

  const [{ data: contacts }, { data: pipelines }, { data: stages }, { data: deals }, { data: activities }] =
    await Promise.all([
      supabase
        .from("contacts")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("pipelines")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: true }),
      supabase
        .from("pipeline_stages")
        .select("*")
        .eq("organization_id", organizationId)
        .order("position", { ascending: true }),
      supabase
        .from("deals")
        .select("*, contact:contacts(name,company_name)")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("deal_activities")
        .select("*, deal:deals(title), contact:contacts(name)")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(20)
    ]);

  return {
    contacts: contacts ?? [],
    pipelines: pipelines ?? [],
    stages: stages ?? [],
    deals: deals ?? [],
    activities: activities ?? []
  };
}
