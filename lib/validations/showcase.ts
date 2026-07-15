import { z } from "zod";

export const showcaseSchema = z.object({
  title: z.string().min(2, "Informe o titulo da vitrine."),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  heroImageUrl: z.string().url("Informe uma URL valida.").optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  instagramUrl: z.string().url("Informe uma URL valida.").optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED"])
});

export const showcaseLinkSchema = z.object({
  label: z.string().min(2, "Informe o nome do link."),
  url: z.string().url("Informe uma URL valida.")
});
