import { z } from "zod";

export const professionalSchema = z.object({
  name: z.string().min(2, "Informe o nome do profissional."),
  email: z.string().email("Informe um e-mail valido.").optional().or(z.literal("")),
  phone: z.string().optional(),
  bio: z.string().optional()
});

export const availabilityRuleSchema = z.object({
  professionalId: z.string().uuid().optional().or(z.literal("")),
  weekday: z.coerce.number().int().min(0).max(6),
  startTime: z.string().min(4),
  endTime: z.string().min(4)
});

export const appointmentSchema = z.object({
  organizationId: z.string().uuid(),
  serviceId: z.string().uuid().optional().or(z.literal("")),
  professionalId: z.string().uuid().optional().or(z.literal("")),
  customerName: z.string().min(2, "Informe seu nome."),
  customerEmail: z.string().email("Informe um e-mail valido.").optional().or(z.literal("")),
  customerPhone: z.string().min(8, "Informe seu telefone."),
  date: z.string().min(10),
  time: z.string().min(4),
  notes: z.string().optional()
});
