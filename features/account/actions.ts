"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string, max = 300) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

export async function updateMyProfileAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const fullName = text(formData, "fullName", 180);
  const phone = text(formData, "phone", 40);
  const whatsapp = text(formData, "whatsapp", 40);
  const avatarUrl = text(formData, "avatarUrl", 800);
  const jobTitle = text(formData, "jobTitle", 120);
  const bio = text(formData, "bio", 600);
  const locale = text(formData, "locale", 20) || "pt-BR";
  const timezone = text(formData, "timezone", 80) || "America/Sao_Paulo";
  const dateFormat = text(formData, "dateFormat", 30) || "dd/MM/yyyy";

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      avatar_url: avatarUrl || null,
      job_title: jobTitle || null,
      bio: bio || null,
      locale,
      timezone,
      date_format: dateFormat
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/minha-conta?error=${encodeURIComponent("Nao foi possivel atualizar seu perfil.")}`);
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: { full_name: fullName || null }
  });

  if (metadataError) {
    redirect(`/minha-conta?error=${encodeURIComponent("Perfil salvo, mas nao foi possivel sincronizar a sessao. Atualize a pagina.")}`);
  }

  revalidatePath("/minha-conta");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  redirect("/minha-conta?success=perfil");
}

export async function updateMyPasswordAction(formData: FormData) {
  await requireUser();
  const supabase = await createClient();
  const password = text(formData, "password", 128);
  const confirmPassword = text(formData, "confirmPassword", 128);

  if (password.length < 8 || password !== confirmPassword) {
    redirect(`/minha-conta?error=${encodeURIComponent("A senha precisa ter 8 caracteres e a confirmacao deve ser igual.")}`);
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/minha-conta?error=${encodeURIComponent("Nao foi possivel alterar a senha agora.")}`);
  }

  redirect("/minha-conta?success=senha");
}
