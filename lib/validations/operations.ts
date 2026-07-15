import { z } from "zod";

export const conversationSchema = z.object({
  contactId: z.string().uuid().optional().or(z.literal("")),
  channel: z.enum(["WHATSAPP", "EMAIL", "INSTAGRAM", "WEBCHAT", "MANUAL"]),
  subject: z.string().min(2, "Informe o assunto."),
  lgpdContext: z.string().optional()
});

export const messageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().min(1, "Informe a mensagem.")
});

export const taskSchema = z.object({
  contactId: z.string().uuid().optional().or(z.literal("")),
  dealId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().min(2, "Informe a tarefa."),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueAt: z.string().optional().or(z.literal(""))
});

export const automationSchema = z.object({
  name: z.string().min(2, "Informe o nome da automacao."),
  description: z.string().optional(),
  triggerKey: z.string().min(2, "Informe o gatilho."),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"])
});
