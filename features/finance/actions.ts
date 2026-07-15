"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/features/organizations/current";
import { financialCategorySchema, financialTransactionSchema } from "@/lib/validations/finance";

export type FinanceActionState = {
  ok: boolean;
  message?: string;
  error?: string;
};

async function getOrganizationOrState() {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);

  if (!organization) {
    return {
      user,
      organization: null,
      state: {
        ok: false,
        error: "Cadastre uma empresa antes de usar o financeiro."
      } satisfies FinanceActionState
    };
  }

  return { user, organization, state: null };
}

export async function createFinancialCategoryAction(formData: FormData) {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);
  if (!organization) throw new Error("Cadastre uma empresa antes do financeiro.");

  const parsed = financialCategorySchema.safeParse({
    type: formData.get("type"),
    name: formData.get("name"),
    description: formData.get("description")
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Dados invalidos.");

  const supabase = await createClient();
  const { error } = await supabase.from("financial_categories").insert({
    organization_id: organization.id,
    type: parsed.data.type,
    name: parsed.data.name,
    description: parsed.data.description || null
  });

  if (error) throw new Error("Nao foi possivel criar a categoria financeira.");
  revalidatePath("/financeiro");
  revalidatePath("/relatorios");
}

export async function createFinancialCategoryStateAction(
  previousState: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  void previousState;
  const { organization, state } = await getOrganizationOrState();
  if (!organization) return state;

  const parsed = financialCategorySchema.safeParse({
    type: formData.get("type"),
    name: formData.get("name"),
    description: formData.get("description")
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Revise os dados." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("financial_categories").insert({
    organization_id: organization.id,
    type: parsed.data.type,
    name: parsed.data.name,
    description: parsed.data.description || null
  });

  if (error) {
    console.error("createFinancialCategoryStateAction", error);
    return { ok: false, error: "Nao foi possivel criar a categoria financeira." };
  }

  revalidatePath("/financeiro");
  revalidatePath("/relatorios");
  return { ok: true, message: "Categoria criada com sucesso." };
}

export async function createFinancialTransactionStateAction(
  previousState: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  void previousState;
  const { user, organization, state } = await getOrganizationOrState();
  if (!organization) return state;

  const parsed = financialTransactionSchema.safeParse({
    categoryId: formData.get("categoryId"),
    type: formData.get("type"),
    status: formData.get("status"),
    paymentMethod: formData.get("paymentMethod"),
    description: formData.get("description"),
    amountCents: formData.get("amountCents"),
    dueDate: formData.get("dueDate"),
    paidAt: formData.get("paidAt"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Revise os dados." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("financial_transactions").insert({
    organization_id: organization.id,
    category_id: parsed.data.categoryId || null,
    created_by: user.id,
    type: parsed.data.type,
    status: parsed.data.status,
    payment_method: parsed.data.paymentMethod,
    description: parsed.data.description,
    amount_cents: parsed.data.amountCents,
    due_date: parsed.data.dueDate || null,
    paid_at: parsed.data.paidAt ? new Date(parsed.data.paidAt).toISOString() : null,
    notes: parsed.data.notes || null
  });

  if (error) {
    console.error("createFinancialTransactionStateAction", error);
    return { ok: false, error: "Nao foi possivel criar o lancamento. Tente novamente." };
  }

  revalidatePath("/financeiro");
  revalidatePath("/relatorios");
  return { ok: true, message: "Lancamento criado com sucesso." };
}

export async function createFinancialTransactionAction(formData: FormData) {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);
  if (!organization) throw new Error("Cadastre uma empresa antes do financeiro.");

  const parsed = financialTransactionSchema.safeParse({
    categoryId: formData.get("categoryId"),
    type: formData.get("type"),
    status: formData.get("status"),
    paymentMethod: formData.get("paymentMethod"),
    description: formData.get("description"),
    amountCents: formData.get("amountCents"),
    dueDate: formData.get("dueDate"),
    paidAt: formData.get("paidAt"),
    notes: formData.get("notes")
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Dados invalidos.");

  const supabase = await createClient();
  const { error } = await supabase.from("financial_transactions").insert({
    organization_id: organization.id,
    category_id: parsed.data.categoryId || null,
    created_by: user.id,
    type: parsed.data.type,
    status: parsed.data.status,
    payment_method: parsed.data.paymentMethod,
    description: parsed.data.description,
    amount_cents: parsed.data.amountCents,
    due_date: parsed.data.dueDate || null,
    paid_at: parsed.data.paidAt ? new Date(parsed.data.paidAt).toISOString() : null,
    notes: parsed.data.notes || null
  });

  if (error) throw new Error("Nao foi possivel criar o lancamento.");
  revalidatePath("/financeiro");
  revalidatePath("/relatorios");
}
