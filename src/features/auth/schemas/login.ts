import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .email("Ingresa un correo válido.")
    .trim()
    .max(254, "El correo es demasiado largo."),
  password: z
    .string()
    .min(1, "Ingresa tu contraseña.")
    .max(128, "La contraseña es demasiado larga."),
});

export type LoginInput = z.infer<typeof loginSchema>;
