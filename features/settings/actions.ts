"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrganizationAccess } from "@/features/organizations/guards";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string, max = 500) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

export async function updateOrganizationProfileAction(formData: FormData) {
  const { user, organization } = await requireOrganizationAccess(["OWNER", "ADMIN"]);
  const supabase = await createClient();

  const payload = {
    name: text(formData, "name", 180),
    legal_name: text(formData, "legalName", 220) || null,
    document: text(formData, "document", 40) || null,
    state_registration: text(formData, "stateRegistration", 80) || null,
    municipal_registration: text(formData, "municipalRegistration", 80) || null,
    phone: text(formData, "phone", 40) || null,
    whatsapp: text(formData, "whatsapp", 40) || null,
    email: text(formData, "email", 180) || null,
    description: text(formData, "description", 1200) || null,
    logo_url: text(formData, "logoUrl", 800) || null,
    cover_url: text(formData, "coverUrl", 800) || null,
    address: text(formData, "address", 240) || null,
    city: text(formData, "city", 120) || null,
    state: text(formData, "state", 80) || null,
    zip_code: text(formData, "zipCode", 40) || null,
    billing_email: text(formData, "billingEmail", 180) || null,
    billing_phone: text(formData, "billingPhone", 40) || null,
    billing_address: text(formData, "billingAddress", 240) || null,
    billing_city: text(formData, "billingCity", 120) || null,
    billing_state: text(formData, "billingState", 80) || null,
    billing_zip_code: text(formData, "billingZipCode", 40) || null
  };

  if (!payload.name) {
    redirect(`/configuracoes?error=${encodeURIComponent("Informe o nome da empresa.")}`);
  }

  const { error } = await supabase
    .from("organizations")
    .update(payload)
    .eq("id", organization.id);

  if (error) {
    redirect(`/configuracoes?error=${encodeURIComponent("Nao foi possivel atualizar a empresa.")}`);
  }

  await supabase.from("audit_logs").insert({
    organization_id: organization.id,
    actor_id: user.id,
    user_id: user.id,
    action: "organization.profile_updated",
    entity_type: "organization",
    entity_id: organization.id,
    metadata: {
      fields: Object.keys(payload)
    }
  });

  revalidatePath("/configuracoes");
  revalidatePath(`/p/${organization.slug}`);
  revalidatePath("/", "layout");
  redirect("/configuracoes?success=empresa");
}
