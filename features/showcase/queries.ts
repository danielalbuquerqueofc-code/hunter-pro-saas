import { createClient } from "@/lib/supabase/server";

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
    .select("id,name,slug,logo_url,cover_url,phone,whatsapp,email,description,address,city,state")
    .eq("slug", slug)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!organization) return null;

  const [{ data: showcase }, { data: links }, { data: gallery }, { data: services }, { data: professionals }] =
    await Promise.all([
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
        .select("id,name,description,image_url,duration_minutes,price_cents,is_online")
        .eq("organization_id", organization.id)
        .eq("is_active", true)
        .order("position", { ascending: true }),
      supabase
        .from("professionals")
        .select("id,name,bio")
        .eq("organization_id", organization.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
    ]);

  return {
    organization,
    showcase,
    links: links ?? [],
    gallery: gallery ?? [],
    services: services ?? [],
    professionals: professionals ?? []
  };
}
