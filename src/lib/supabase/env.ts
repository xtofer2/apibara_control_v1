import { z } from "zod";

const supabasePublicEnvSchema = z.object({
  url: z.url("NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida."),
  publishableKey: z
    .string()
    .trim()
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY es obligatoria."),
});

export function hasSupabasePublicEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function getSupabasePublicEnv() {
  const result = supabasePublicEnvSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => issue.message)
      .join(" ");

    throw new Error(`Configuración pública de Supabase inválida. ${details}`);
  }

  return result.data;
}
