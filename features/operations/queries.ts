import { createClient } from "@/lib/supabase/server";

export async function getOperationsData(organizationId: string) {
  const supabase = await createClient();
  const [{ data: conversations }, { data: tasks }, { data: automations }, { data: contacts }, { data: deals }] =
    await Promise.all([
      supabase
        .from("conversations")
        .select("*, contact:contacts(name,phone)")
        .eq("organization_id", organizationId)
        .order("updated_at", { ascending: false })
        .limit(40),
      supabase
        .from("tasks")
        .select("*, contact:contacts(name), deal:deals(title)")
        .eq("organization_id", organizationId)
        .order("due_at", { ascending: true })
        .limit(60),
      supabase
        .from("automations")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("contacts")
        .select("id,name,phone")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("deals")
        .select("id,title")
        .eq("organization_id", organizationId)
        .eq("status", "OPEN")
        .order("created_at", { ascending: false })
        .limit(80)
    ]);

  return {
    conversations: conversations ?? [],
    tasks: tasks ?? [],
    automations: automations ?? [],
    contacts: contacts ?? [],
    deals: deals ?? []
  };
}
