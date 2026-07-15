import { z } from "zod";

export const serviceCategorySchema = z.object({
  name: z.string().min(2, "Informe o nome da categoria."),
  description: z.string().optional()
});

export const serviceSchema = z.object({
  categoryId: z.string().uuid().optional().or(z.literal("")),
  name: z.string().min(2, "Informe o nome do servico."),
  description: z.string().optional(),
  durationMinutes: z.coerce.number().int().positive().default(60),
  priceCents: z.coerce.number().int().min(0).default(0),
  isOnline: z.coerce.boolean().default(true)
});
