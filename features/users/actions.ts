"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertCanAddOrganizationUser } from "@/features/billing/plan-limits";
import { requireOrganizationAccess } from "@/features/organizations/guards";
import type { Role } from "@/lib/constants/roles";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const COMPANY_ROLES: Role[] = ["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT", "PROFESSIONAL", "FINANCIAL"];
const MEMBER_STATUSES = ["ACTIVE", "INVITED", "SUSPENDED"] as const;

function normalizeRole(value: FormDataEntryValue | null): Role {
  const role = String(value ?? "");
  if (COMPANY_ROLES.includes(role as Role)) return role as Role;
  throw new Error("Perfil invalido.");
}

function normalizeStatus(value: FormDataEntryValue | null) {
  const status = String(value ?? "");
  if (MEMBER_STATUSES.includes(status as (typeof MEMBER_STATUSES)[number])) return status;
  throw new Error("Status invalido.");
}

export async function updateOrganizationMemberAction(formData: FormData) {
  const { user, organization } = await requireOrganizationAccess(["OWNER", "ADMIN"]);
  const supabase = await createClient();
  const memberId = String(formData.get("memberId") ?? "");
  const role = normalizeRole(formData.get("role"));
  const status = normalizeStatus(formData.get("status"));

  if (!memberId) {
    redirect(`/usuarios?error=${encodeURIComponent("Membro nao informado.")}`);
  }

  const { data: member } = await supabase
    .from("organization_members")
    .select("id,user_id,role,status")
    .eq("id", memberId)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (!member) {
    redirect(`/usuarios?error=${encodeURIComponent("Membro nao encontrado nesta empresa.")}`);
  }

  if (member.user_id === user.id && (role !== "OWNER" || status !== "ACTIVE")) {
    redirect(`/usuarios?error=${encodeURIComponent("Voce nao pode remover seu proprio acesso administrativo.")}`);
  }

  const { error } = await supabase
    .from("organization_members")
    .update({ role, status })
    .eq("id", memberId)
    .eq("organization_id", organization.id);

  if (error) {
    redirect(`/usuarios?error=${encodeURIComponent("Nao foi possivel atualizar o membro.")}`);
  }

  await supabase.from("audit_logs").insert({
    organization_id: organization.id,
    actor_id: user.id,
    user_id: member.user_id,
    action: "member.updated",
    entity_type: "organization_member",
    entity_id: member.id,
    metadata: {
      before: { role: member.role, status: member.status },
      after: { role, status }
    }
  });

  revalidatePath("/usuarios");
  redirect("/usuarios?success=membro");
}

export async function inviteOrganizationUserAction(formData: FormData) {
  const { user, organization } = await requireOrganizationAccess(["OWNER", "ADMIN"]);
  const supabase = await createClient();
  const admin = createAdminClient();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = normalizeRole(formData.get("role"));

  if (!email || !email.includes("@")) {
    redirect(`/usuarios?error=${encodeURIComponent("Informe um e-mail valido para convite.")}`);
  }

  const { data: existingInvitation } = await supabase
    .from("organization_invitations")
    .select("id,status,expires_at")
    .eq("organization_id", organization.id)
    .eq("email", email)
    .eq("status", "SENT")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (existingInvitation) {
    redirect(`/usuarios?error=${encodeURIComponent("Ja existe um convite pendente para este e-mail.")}`);
  }

  try {
    await assertCanAddOrganizationUser(supabase, organization.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "O limite de usuarios do plano foi atingido.";
    redirect(`/usuarios?error=${encodeURIComponent(message)}`);
  }

  const { data: invite, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${env.appUrl.replace(/\/$/, "")}/auth/callback?next=/definir-senha`,
    data: {
      invited_to_organization_id: organization.id,
      invited_to_organization_name: organization.name,
      invited_role: role
    }
  });

  if (error || !invite.user?.id) {
    await supabase.from("organization_invitations").upsert(
      {
        organization_id: organization.id,
        email,
        role,
        status: "FAILED",
        invited_by: user.id,
        provider_error: error?.message ?? "Convite nao retornou usuario."
      },
      { onConflict: "organization_id,email" }
    );
    redirect(`/usuarios?error=${encodeURIComponent(error?.message ?? "Nao foi possivel enviar o convite.")}`);
  }

  await supabase.from("profiles").upsert({
    id: invite.user.id,
    full_name: email
  });

  const { error: memberError } = await supabase.from("organization_members").upsert(
    {
      organization_id: organization.id,
      user_id: invite.user.id,
      role,
      status: "ACTIVE",
      invited_by: user.id
    },
    { onConflict: "organization_id,user_id" }
  );

  if (memberError) {
    redirect(`/usuarios?error=${encodeURIComponent("Convite enviado, mas nao foi possivel vincular o usuario a empresa.")}`);
  }

  await supabase.from("organization_invitations").upsert(
    {
      organization_id: organization.id,
      email,
      role,
      status: "SENT",
      invited_by: user.id,
      invited_user_id: invite.user.id,
      provider_user_id: invite.user.id
    },
    { onConflict: "organization_id,email" }
  );

  await supabase.from("audit_logs").insert({
    organization_id: organization.id,
    actor_id: user.id,
    user_id: invite.user.id,
    action: "member.invited",
    entity_type: "organization_member",
    metadata: { email, role }
  });

  revalidatePath("/usuarios");
  redirect("/usuarios?success=convite");
}
