import { createClient } from "@/lib/supabase/server";

export async function getServicesData(organizationId: string) {
  const supabase = await createClient();
  const [{ data: categories }, { data: services }] = await Promise.all([
    supabase
      .from("service_categories")
      .select("*")
      .eq("organization_id", organizationId)
      .order("position", { ascending: true }),
    supabase
      .from("services")
      .select("*, category:service_categories(name)")
      .eq("organization_id", organizationId)
      .order("position", { ascending: true })
  ]);

  return {
    categories: categories ?? [],
    services: services ?? []
  };
}
