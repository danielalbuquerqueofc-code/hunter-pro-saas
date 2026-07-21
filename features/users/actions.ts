"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrganizationAccess } from "@/features/organizations/guards";
import type { Role } from "@/lib/constants/roles";
import { createClient } from "@/lib/supabase/server";

const COMPANY_ROLES: Role[] = ["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT", "PROFESSIONAL", "FINANCIAL"];
const MEMBER_STATUSES = ["ACTIVE", "INVITED", "DISABLED"] as const;

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
