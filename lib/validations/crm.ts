import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Informe o nome do lead."),
  email: z.string().email("Informe um e-mail valido.").optional().or(z.literal("")),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  lgpdConsent: z.coerce.boolean().default(false)
});

export const dealSchema = z.object({
  contactId: z.string().uuid("Selecione um contato."),
  title: z.string().min(2, "Informe o titulo da oportunidade."),
  valueCents: z.coerce.number().int().min(0).default(0),
  expectedCloseDate: z.string().optional().or(z.literal(""))
});

export const dealActivitySchema = z.object({
  dealId: z.string().uuid().optional().or(z.literal("")),
  contactId: z.string().uuid().optional().or(z.literal("")),
  type: z.enum(["NOTE", "CALL", "EMAIL", "WHATSAPP", "MEETING", "TASK"]),
  title: z.string().min(2, "Informe o titulo da atividade."),
  body: z.string().optional(),
  dueAt: z.string().optional().or(z.literal(""))
});
