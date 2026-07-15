import { createClient } from "@/lib/supabase/server";

export async function getAiData(organizationId: string) {
  const supabase = await createClient();
  const [{ data: agents }, { data: runs }, { data: events }, { data: integrations }] = await Promise.all([
    supabase
      .from("ai_agents")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("ai_agent_runs")
      .select("*, ai_agent:ai_agents(name)")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("integration_events")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("integrations")
      .select("*")
      .eq("organization_id", organizationId)
      .order("provider", { ascending: true })
  ]);

  return {
    agents: agents ?? [],
    runs: runs ?? [],
    events: events ?? [],
    integrations: integrations ?? []
  };
}
