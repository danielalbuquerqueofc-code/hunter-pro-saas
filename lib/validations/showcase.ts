import { z } from "zod";

export const showcaseSchema = z.object({
  title: z.string().min(2, "Informe o titulo da vitrine."),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  heroImageUrl: z.string().url("Informe uma URL valida.").optional().or(z.literal("")),
  logoUrl: z.string().url("Informe uma URL valida.").optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  phone: z.string().optional(),
  instagramUrl: z.string().url("Informe uma URL valida.").optional().or(z.literal("")),
  facebookUrl: z.string().url("Informe uma URL valida.").optional().or(z.literal("")),
  tiktokUrl: z.string().url("Informe uma URL valida.").optional().or(z.literal("")),
  youtubeUrl: z.string().url("Informe uma URL valida.").optional().or(z.literal("")),
  addressText: z.string().optional(),
  themeKey: z.enum(["clean_light", "premium_dark", "beauty", "wellness", "professional_blue", "gold"]),
  fontKey: z.enum(["sans", "serif", "rounded"]),
  status: z.enum(["DRAFT", "PUBLISHED"])
});

export const showcaseLinkSchema = z.object({
  label: z.string().min(2, "Informe o nome do link."),
  url: z.string().url("Informe uma URL valida.")
});
