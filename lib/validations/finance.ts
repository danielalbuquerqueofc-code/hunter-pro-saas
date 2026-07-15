import { z } from "zod";

export const financialCategorySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  name: z.string().min(2, "Informe o nome da categoria."),
  description: z.string().optional()
});

export const financialTransactionSchema = z.object({
  categoryId: z.string().uuid().optional().or(z.literal("")),
  type: z.enum(["INCOME", "EXPENSE"]),
  status: z.enum(["PENDING", "PAID", "CANCELED"]),
  paymentMethod: z.enum([
    "PIX",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "BANK_TRANSFER",
    "CASH",
    "BOLETO",
    "OTHER"
  ]),
  description: z.string().min(2, "Informe a descricao."),
  amountCents: z.coerce.number().int().positive("Informe um valor maior que zero."),
  dueDate: z.string().optional().or(z.literal("")),
  paidAt: z.string().optional().or(z.literal("")),
  notes: z.string().optional()
});
