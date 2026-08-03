"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { getSafeInternalPath } from "@/lib/safe-redirect";
import { signInSchema, signUpSchema } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/server";

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function formatAuthError(error: unknown) {
  if (error instanceof Error && error.message === "fetch failed") {
    return "Nao foi possivel conectar ao Supabase. Verifique se o projeto terminou de restaurar e se a internet esta liberada.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Erro inesperado ao conectar ao Supabase.";
}

export async function signInAction(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });
  const next = getSafeInternalPath(formData.get("next"));

  if (!parsed.success) {
    redirectWithError("/login", parsed.error.errors[0]?.message ?? "Dados invalidos.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth
    .signInWithPassword(parsed.data)
    .catch((requestError: unknown) => ({ error: new Error(formatAuthError(requestError)) }));

  if (error) {
    redirectWithError("/login", error.message || "E-mail ou senha invalidos.");
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function requestPasswordRecoveryAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    redirectWithError("/recuperar-senha", "Informe um e-mail valido.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.appUrl.replace(/\/$/, "")}/auth/callback?next=/definir-senha`
  });

  if (error) {
    redirectWithError("/recuperar-senha", "Nao foi possivel enviar o link agora.");
  }

  redirect("/recuperar-senha?success=1");
}

export async function definePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8 || password !== confirmPassword) {
    redirectWithError("/definir-senha", "A senha precisa ter pelo menos 8 caracteres e ser igual a confirmacao.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirectWithError("/definir-senha", "Sua sessao expirou. Solicite um novo convite ou link de recuperacao.");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    organizationName: formData.get("organizationName"),
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    redirectWithError("/cadastro", parsed.error.errors[0]?.message ?? "Dados invalidos.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth
    .signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName,
          organization_name: parsed.data.organizationName
        }
      }
    })
    .catch((requestError: unknown) => ({ error: new Error(formatAuthError(requestError)) }));

  if (error) {
    redirectWithError("/cadastro", error.message);
  }

  revalidatePath("/", "layout");
  redirect("/configuracoes");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
