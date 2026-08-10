"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrganizationAccess } from "@/features/organizations/guards";
import { encryptSecret } from "@/lib/server-crypto";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string, max = 500) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

function numberValue(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").replace(",", ".").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function centsValue(formData: FormData, key: string) {
  const parsed = numberValue(formData, key);
  return parsed === null ? null : Math.round(parsed * 100);
}

export async function savePaymentSettingsAction(formData: FormData) {
  const { user, organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "FINANCIAL"]);
  const supabase = await createClient();

  const pixKeyType = text(formData, "pixKeyType", 20);
  const accountType = text(formData, "accountType", 20);
  const sendMode = text(formData, "sendMode", 40) || "NEVER";
  const holderDocument = text(formData, "holderDocument", 40);
  const bankAccount = text(formData, "bankAccount", 60);
  const pixKey = text(formData, "pixKey", 180);

  const payload = {
    organization_id: organization.id,
    holder_name: text(formData, "holderName", 180) || null,
    holder_document: null,
    holder_document_encrypted: holderDocument ? encryptSecret(holderDocument) : null,
    bank_name: text(formData, "bankName", 120) || null,
    bank_agency: text(formData, "bankAgency", 40) || null,
    bank_account: null,
    bank_account_encrypted: bankAccount ? encryptSecret(bankAccount) : null,
    account_type: accountType || null,
    pix_key: null,
    pix_key_encrypted: pixKey ? encryptSecret(pixKey) : null,
    pix_key_type: pixKeyType || null,
    beneficiary_name: text(formData, "beneficiaryName", 180) || null,
    payment_instructions: text(formData, "paymentInstructions", 1200) || null,
    default_deposit_cents: centsValue(formData, "defaultDeposit"),
    default_deposit_percent: numberValue(formData, "defaultDepositPercent"),
    payment_deadline_hours: Math.max(0, Number(numberValue(formData, "paymentDeadlineHours") ?? 24)),
    static_pix_qr_code_url: text(formData, "staticPixQrCodeUrl", 800) || null,
    send_payment_data_mode: sendMode,
    show_bank_details_publicly: formData.get("showBankDetailsPublicly") === "on",
    is_active: formData.get("isActive") === "on",
    updated_by: user.id
  };

  const { data: existing } = await supabase
    .from("organization_payment_settings")
    .select("id")
    .eq("organization_id", organization.id)
    .maybeSingle();

  const { error } = existing?.id
    ? await supabase.from("organization_payment_settings").update(payload).eq("id", existing.id)
    : await supabase.from("organization_payment_settings").insert(payload);

  if (error) {
    redirect(`/pagamentos-pix?error=${encodeURIComponent("Nao foi possivel salvar os dados de pagamento.")}`);
  }

  await supabase.from("audit_logs").insert({
    organization_id: organization.id,
    actor_id: user.id,
    user_id: user.id,
    action: "payments.settings_updated",
    entity_type: "organization_payment_settings",
    metadata: {
      fields: Object.keys(payload).filter((field) => !["holder_document", "bank_account", "pix_key"].includes(field))
    }
  });

  revalidatePath("/pagamentos-pix");
  redirect("/pagamentos-pix?success=pagamentos");
}
