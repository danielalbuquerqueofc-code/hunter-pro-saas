import { z } from "zod";

function priceToCents(value: unknown) {
  if (typeof value === "number") return Math.round(value * 100);

  const raw = String(value ?? "").trim();
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;
  const parsed = Number(normalized || 0);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export const serviceCategorySchema = z.object({
  name: z.string().min(2, "Informe o nome da categoria."),
  description: z.string().optional()
});

export const serviceSchema = z.object({
  categoryId: z.string().uuid().optional().or(z.literal("")),
  name: z.string().min(2, "Informe o nome do servico."),
  description: z.string().optional(),
  imageUrl: z.string().url("Informe uma URL de imagem valida.").optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().positive().default(60),
  marginBeforeMinutes: z.coerce.number().int().min(0).default(0),
  marginAfterMinutes: z.coerce.number().int().min(0).default(10),
  priceCents: z.preprocess(priceToCents, z.number().int().min(0).default(0)),
  isOnline: z.coerce.boolean().default(true)
});
