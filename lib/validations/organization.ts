import { z } from "zod";

export const organizationSchema = z.object({
  name: z.string().min(2, "Informe o nome da empresa."),
  slug: z
    .string()
    .min(3, "O slug precisa ter pelo menos 3 caracteres.")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minusculas, numeros e hifens.")
});
