import { z } from "zod";

export const aiAgentSchema = z.object({
  name: z.string().min(2, "Informe o nome do agente."),
  goal: z.enum(["QUALIFY_LEADS", "FOLLOW_UP", "SUPPORT", "SALES_ASSISTANT", "OPERATIONS"]),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]),
  instructions: z.string().min(10, "Informe instrucoes mais completas."),
  guardrails: z.string().optional()
});
