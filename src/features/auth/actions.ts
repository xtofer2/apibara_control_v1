"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { loginSchema } from "./schemas/login";
import { findProfileById } from "./server/profile-repository";

export type LoginActionResult = { error: string };

export async function loginAction(
  input: unknown,
): Promise<LoginActionResult | never> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return { error: "Revisa el correo y la contraseña." };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword(
    parsed.data,
  );

  if (signInError) {
    return { error: "El correo o la contraseña son incorrectos." };
  }

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    await supabase.auth.signOut();
    return { error: "No pudimos verificar la sesión. Intenta nuevamente." };
  }

  const { data: profile, error: profileError } = await findProfileById(
    supabase,
    userId,
  );

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return { error: "Tu cuenta no tiene un perfil operativo habilitado." };
  }

  if (!profile.active) {
    await supabase.auth.signOut();
    return { error: "Tu cuenta está inactiva. Contacta a un administrador." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
