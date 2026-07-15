import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Informe um e-mail valido."),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres.")
});

export const signUpSchema = signInSchema.extend({
  fullName: z.string().min(2, "Informe seu nome."),
  organizationName: z.string().min(2, "Informe o nome da empresa.")
});
