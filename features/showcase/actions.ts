"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { showcaseLinkSchema, showcaseSchema } from "@/lib/validations/showcase";
import { getCurrentOrganization } from "@/features/organizations/current";

export type ShowcaseActionState = {
  ok: boolean;
  message?: string;
  error?: string;
};

type ShowcaseFormValues = z.infer<typeof showcaseSchema>;
const defaultSectionVisibility = {
  hero: true,
  trust: true,
  about: true,
  services: true,
  professionals: true,
  gallery: true,
  reviews: true,
  promotions: true,
  contact: true,
  hours: true,
  payments: true,
  links: true,
  cta: true,
  footer: true
};
const defaultSectionOrder = [
  "hero",
  "trust",
  "about",
  "services",
  "professionals",
  "gallery",
  "reviews",
  "promotions",
  "contact",
  "hours",
  "payments",
  "links",
  "cta",
  "footer"
];

function parseShowcaseForm(formData: FormData) {
  return showcaseSchema.safeParse({
    title: formData.get("title"),
    subtitle: formData.get("subtitle"),
    description: formData.get("description"),
    commercialName: formData.get("commercialName"),
    slogan: formData.get("slogan"),
    heroImageUrl: formData.get("heroImageUrl"),
    logoUrl: formData.get("logoUrl"),
    profileImageUrl: formData.get("profileImageUrl"),
    faviconUrl: formData.get("faviconUrl"),
    whatsapp: formData.get("whatsapp"),
    phone: formData.get("phone"),
    instagramUrl: formData.get("instagramUrl"),
    facebookUrl: formData.get("facebookUrl"),
    tiktokUrl: formData.get("tiktokUrl"),
    youtubeUrl: formData.get("youtubeUrl"),
    addressText: formData.get("addressText"),
    serviceArea: formData.get("serviceArea"),
    openingHoursText: formData.get("openingHoursText"),
    paymentMethodsText: formData.get("paymentMethodsText"),
    primaryColor: formData.get("primaryColor"),
    accentColor: formData.get("accentColor"),
    backgroundColor: formData.get("backgroundColor"),
    cardColor: formData.get("cardColor"),
    textColor: formData.get("textColor"),
    buttonColor: formData.get("buttonColor"),
    buttonTextColor: formData.get("buttonTextColor"),
    borderColor: formData.get("borderColor"),
    ctaPrimaryText: formData.get("ctaPrimaryText"),
    ctaSecondaryText: formData.get("ctaSecondaryText"),
    radiusStyle: formData.get("radiusStyle"),
    shadowStyle: formData.get("shadowStyle"),
    themeKey: formData.get("themeKey"),
    fontKey: formData.get("fontKey"),
    sectionVisibility: formData.get("sectionVisibility"),
    sectionOrder: formData.get("sectionOrder"),
    status: formData.get("status")
  });
}

function showcasePayload(parsed: ShowcaseFormValues, organizationId: string, userId: string) {
  const now = new Date().toISOString();
  return {
    organization_id: organizationId,
    title: parsed.title,
    subtitle: parsed.subtitle || null,
    description: parsed.description || null,
    commercial_name: parsed.commercialName || null,
    slogan: parsed.slogan || null,
    hero_image_url: parsed.heroImageUrl || null,
    logo_url: parsed.logoUrl || null,
    profile_image_url: parsed.profileImageUrl || null,
    favicon_url: parsed.faviconUrl || null,
    whatsapp: parsed.whatsapp || null,
    phone: parsed.phone || null,
    instagram_url: parsed.instagramUrl || null,
    facebook_url: parsed.facebookUrl || null,
    tiktok_url: parsed.tiktokUrl || null,
    youtube_url: parsed.youtubeUrl || null,
    address_text: parsed.addressText || null,
    service_area: parsed.serviceArea || null,
    opening_hours_text: parsed.openingHoursText || null,
    payment_methods_text: parsed.paymentMethodsText || null,
    primary_color: parsed.primaryColor || null,
    accent_color: parsed.accentColor || null,
    background_color: parsed.backgroundColor || null,
    card_color: parsed.cardColor || null,
    text_color: parsed.textColor || null,
    button_color: parsed.buttonColor || null,
    button_text_color: parsed.buttonTextColor || null,
    border_color: parsed.borderColor || null,
    cta_primary_text: parsed.ctaPrimaryText || "Agendar agora",
    cta_secondary_text: parsed.ctaSecondaryText || "Falar no WhatsApp",
    radius_style: parsed.radiusStyle,
    shadow_style: parsed.shadowStyle,
    theme_key: parsed.themeKey,
    font_key: parsed.fontKey,
    section_visibility: { ...defaultSectionVisibility, ...(parsed.sectionVisibility ?? {}) },
    section_order: parsed.sectionOrder?.length ? parsed.sectionOrder : defaultSectionOrder,
    status: parsed.status,
    updated_by: userId,
    published_at: parsed.status === "PUBLISHED" ? now : null
  };
}

export async function saveShowcaseAction(formData: FormData) {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);
  if (!organization) throw new Error("Cadastre uma empresa antes de criar a vitrine.");

  const parsed = parseShowcaseForm(formData);

  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Dados invalidos.");

  const supabase = await createClient();
  const { error } = await supabase.from("showcases").upsert(
    showcasePayload(parsed.data, organization.id, user.id),
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

  const parsed = parseShowcaseForm(formData);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Revise os dados da vitrine." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("showcases").upsert(
    showcasePayload(parsed.data, organization.id, user.id),
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
