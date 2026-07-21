"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { showcaseLinkSchema, showcaseSchema } from "@/lib/validations/showcase";
import { getCurrentOrganization } from "@/features/organizations/current";

export type ShowcaseActionState = {
  ok: boolean;
  message?: string;
  error?: string;
};

export async function saveShowcaseAction(formData: FormData) {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);
  if (!organization) throw new Error("Cadastre uma empresa antes de criar a vitrine.");

  const parsed = showcaseSchema.safeParse({
    title: formData.get("title"),
    subtitle: formData.get("subtitle"),
    description: formData.get("description"),
    heroImageUrl: formData.get("heroImageUrl"),
    logoUrl: formData.get("logoUrl"),
    whatsapp: formData.get("whatsapp"),
    phone: formData.get("phone"),
    instagramUrl: formData.get("instagramUrl"),
    facebookUrl: formData.get("facebookUrl"),
    tiktokUrl: formData.get("tiktokUrl"),
    youtubeUrl: formData.get("youtubeUrl"),
    addressText: formData.get("addressText"),
    primaryColor: formData.get("primaryColor"),
    themeKey: formData.get("themeKey"),
    fontKey: formData.get("fontKey"),
    status: formData.get("status")
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Dados invalidos.");

  const supabase = await createClient();
  const { error } = await supabase.from("showcases").upsert(
    {
      organization_id: organization.id,
      title: parsed.data.title,
      subtitle: parsed.data.subtitle || null,
      description: parsed.data.description || null,
      hero_image_url: parsed.data.heroImageUrl || null,
      logo_url: parsed.data.logoUrl || null,
      whatsapp: parsed.data.whatsapp || null,
      phone: parsed.data.phone || null,
      instagram_url: parsed.data.instagramUrl || null,
      facebook_url: parsed.data.facebookUrl || null,
      tiktok_url: parsed.data.tiktokUrl || null,
      youtube_url: parsed.data.youtubeUrl || null,
      address_text: parsed.data.addressText || null,
      primary_color: parsed.data.primaryColor || null,
      theme_key: parsed.data.themeKey,
      font_key: parsed.data.fontKey,
      status: parsed.data.status
    },
    { onConflict: "organization_id" }
  );

  if (error) throw new Error("Nao foi possivel salvar a vitrine.");
  revalidatePath("/vitrine");
  revalidatePath(`/p/${organization.slug}`);
}

export async function saveShowcaseStateAction(
  previousState: ShowcaseActionState,
  formData: FormData
): Promise<ShowcaseActionState> {
  void previousState;

  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);

  if (!organization) {
    return { ok: false, error: "Cadastre sua empresa antes de criar a vitrine." };
  }

  const parsed = showcaseSchema.safeParse({
    title: formData.get("title"),
    subtitle: formData.get("subtitle"),
    description: formData.get("description"),
    heroImageUrl: formData.get("heroImageUrl"),
    logoUrl: formData.get("logoUrl"),
    whatsapp: formData.get("whatsapp"),
    phone: formData.get("phone"),
    instagramUrl: formData.get("instagramUrl"),
    facebookUrl: formData.get("facebookUrl"),
    tiktokUrl: formData.get("tiktokUrl"),
    youtubeUrl: formData.get("youtubeUrl"),
    addressText: formData.get("addressText"),
    primaryColor: formData.get("primaryColor"),
    themeKey: formData.get("themeKey"),
    fontKey: formData.get("fontKey"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Revise os dados da vitrine." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("showcases").upsert(
    {
      organization_id: organization.id,
      title: parsed.data.title,
      subtitle: parsed.data.subtitle || null,
      description: parsed.data.description || null,
      hero_image_url: parsed.data.heroImageUrl || null,
      logo_url: parsed.data.logoUrl || null,
      whatsapp: parsed.data.whatsapp || null,
      phone: parsed.data.phone || null,
      instagram_url: parsed.data.instagramUrl || null,
      facebook_url: parsed.data.facebookUrl || null,
      tiktok_url: parsed.data.tiktokUrl || null,
      youtube_url: parsed.data.youtubeUrl || null,
      address_text: parsed.data.addressText || null,
      primary_color: parsed.data.primaryColor || null,
      theme_key: parsed.data.themeKey,
      font_key: parsed.data.fontKey,
      status: parsed.data.status
    },
    { onConflict: "organization_id" }
  );

  if (error) {
    console.error("saveShowcaseStateAction", error);
    return { ok: false, error: "Nao foi possivel salvar a vitrine agora." };
  }

  revalidatePath("/vitrine");
  revalidatePath(`/p/${organization.slug}`);
  return { ok: true, message: "Vitrine salva com sucesso." };
}

export async function createShowcaseLinkAction(formData: FormData) {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);
  if (!organization) throw new Error("Cadastre uma empresa antes de criar links.");

  const parsed = showcaseLinkSchema.safeParse({
    label: formData.get("label"),
    url: formData.get("url")
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Dados invalidos.");

  const supabase = await createClient();
  const { data: showcase } = await supabase
    .from("showcases")
    .select("id")
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (!showcase) throw new Error("Salve a vitrine antes de adicionar links.");

  const { error } = await supabase.from("showcase_links").insert({
    organization_id: organization.id,
    showcase_id: showcase.id,
    label: parsed.data.label,
    url: parsed.data.url
  });

  if (error) throw new Error("Nao foi possivel criar o link.");
  revalidatePath("/vitrine");
  revalidatePath(`/p/${organization.slug}`);
}

export async function createShowcaseLinkStateAction(
  previousState: ShowcaseActionState,
  formData: FormData
): Promise<ShowcaseActionState> {
  void previousState;

  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);

  if (!organization) {
    return { ok: false, error: "Cadastre sua empresa antes de criar links." };
  }

  const parsed = showcaseLinkSchema.safeParse({
    label: formData.get("label"),
    url: formData.get("url")
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Revise os dados do link." };
  }

  const supabase = await createClient();
  const { data: showcase, error: showcaseError } = await supabase
    .from("showcases")
    .select("id")
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (showcaseError) {
    console.error("createShowcaseLinkStateAction:showcase", showcaseError);
    return { ok: false, error: "Nao foi possivel localizar sua vitrine agora." };
  }

  if (!showcase) {
    return { ok: false, error: "Salve a vitrine antes de adicionar links." };
  }

  const { error } = await supabase.from("showcase_links").insert({
    organization_id: organization.id,
    showcase_id: showcase.id,
    label: parsed.data.label,
    url: parsed.data.url
  });

  if (error) {
    console.error("createShowcaseLinkStateAction", error);
    return { ok: false, error: "Nao foi possivel criar o link agora." };
  }

  revalidatePath("/vitrine");
  revalidatePath(`/p/${organization.slug}`);
  return { ok: true, message: "Link adicionado com sucesso." };
}
