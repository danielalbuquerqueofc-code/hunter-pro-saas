import { z } from "zod";

const showcaseSectionKeys = [
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
] as const;

const sectionKeySchema = z.enum(showcaseSectionKeys);
const sectionVisibilitySchema = z.record(z.boolean()).transform((value) => {
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => sectionKeySchema.safeParse(key).success)
  );
});
const sectionOrderSchema = z.array(z.enum(showcaseSectionKeys));

function parseJsonField(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

export const showcaseSchema = z.object({
  title: z.string().min(2, "Informe o titulo da vitrine."),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  commercialName: z.string().optional(),
  slogan: z.string().optional(),
  heroImageUrl: z.string().url("Informe uma URL valida.").optional().or(z.literal("")),
  logoUrl: z.string().url("Informe uma URL valida.").optional().or(z.literal("")),
  profileImageUrl: z.string().url("Informe uma URL valida.").optional().or(z.literal("")),
  faviconUrl: z.string().url("Informe uma URL valida.").optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  phone: z.string().optional(),
  instagramUrl: z.string().url("Informe uma URL valida.").optional().or(z.literal("")),
  facebookUrl: z.string().url("Informe uma URL valida.").optional().or(z.literal("")),
  tiktokUrl: z.string().url("Informe uma URL valida.").optional().or(z.literal("")),
  youtubeUrl: z.string().url("Informe uma URL valida.").optional().or(z.literal("")),
  addressText: z.string().optional(),
  serviceArea: z.string().optional(),
  openingHoursText: z.string().optional(),
  paymentMethodsText: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i, "Informe uma cor valida.").optional().or(z.literal("")),
  accentColor: z.string().regex(/^#[0-9a-f]{6}$/i, "Informe uma cor valida.").optional().or(z.literal("")),
  backgroundColor: z.string().regex(/^#[0-9a-f]{6}$/i, "Informe uma cor valida.").optional().or(z.literal("")),
  cardColor: z.string().regex(/^#[0-9a-f]{6}$/i, "Informe uma cor valida.").optional().or(z.literal("")),
  textColor: z.string().regex(/^#[0-9a-f]{6}$/i, "Informe uma cor valida.").optional().or(z.literal("")),
  buttonColor: z.string().regex(/^#[0-9a-f]{6}$/i, "Informe uma cor valida.").optional().or(z.literal("")),
  buttonTextColor: z.string().regex(/^#[0-9a-f]{6}$/i, "Informe uma cor valida.").optional().or(z.literal("")),
  borderColor: z.string().regex(/^#[0-9a-f]{6}$/i, "Informe uma cor valida.").optional().or(z.literal("")),
  ctaPrimaryText: z.string().optional(),
  ctaSecondaryText: z.string().optional(),
  radiusStyle: z.enum(["soft", "large", "pill"]),
  shadowStyle: z.enum(["none", "soft", "elevated"]),
  themeKey: z.enum(["clean_light", "premium_dark", "beauty", "wellness", "professional_blue", "gold", "modern", "elegant", "minimal", "dark", "light", "automotive", "professional"]),
  fontKey: z.enum(["sans", "serif", "rounded"]),
  sectionVisibility: z.preprocess(parseJsonField, sectionVisibilitySchema.optional()),
  sectionOrder: z.preprocess(parseJsonField, sectionOrderSchema.optional()),
  status: z.enum(["DRAFT", "PUBLISHED"])
});

export const showcaseLinkSchema = z.object({
  label: z.string().min(2, "Informe o nome do link."),
  url: z.string().url("Informe uma URL valida.")
});
