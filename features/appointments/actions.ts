"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getCurrentOrganization } from "@/features/organizations/current";
import {
  appointmentSchema,
  availabilityRuleSchema,
  professionalSchema
} from "@/lib/validations/appointment";

export type ProfessionalActionState = {
  ok: boolean;
  message?: string;
  error?: string;
};

const initialProfessionalState: ProfessionalActionState = { ok: false };

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function getOrganizationOrState() {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);

  if (!organization) {
    return {
      organization: null,
      state: {
        ok: false,
        error: "Cadastre uma empresa antes de gerenciar profissionais."
      } satisfies ProfessionalActionState
    };
  }

  return { organization, state: null };
}

export async function createProfessionalAction(formData: FormData) {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);
  if (!organization) throw new Error("Cadastre uma empresa antes de criar profissionais.");

  const parsed = professionalSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    bio: formData.get("bio")
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Dados invalidos.");

  const supabase = await createClient();
  const { error } = await supabase.from("professionals").insert({
    organization_id: organization.id,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    bio: parsed.data.bio || null
  });

  if (error) throw new Error("Nao foi possivel criar o profissional.");
  revalidatePath("/agenda");
}

export async function createProfessionalStateAction(
  previousState: ProfessionalActionState = initialProfessionalState,
  formData: FormData
): Promise<ProfessionalActionState> {
  void previousState;
  const { organization, state } = await getOrganizationOrState();
  if (!organization) return state;

  const parsed = professionalSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    bio: formData.get("bio")
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Revise os dados do profissional."
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("professionals").insert({
    organization_id: organization.id,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    bio: parsed.data.bio || null,
    is_active: formData.get("isActive") !== "off"
  });

  if (error) {
    console.error("createProfessionalStateAction", error);
    return {
      ok: false,
      error: "Nao foi possivel cadastrar o profissional. Revise os dados e tente novamente."
    };
  }

  revalidatePath("/agenda");
  return { ok: true, message: "Profissional cadastrado com sucesso." };
}

export async function updateProfessionalStateAction(
  previousState: ProfessionalActionState = initialProfessionalState,
  formData: FormData
): Promise<ProfessionalActionState> {
  void previousState;
  const { organization, state } = await getOrganizationOrState();
  if (!organization) return state;

  const professionalId = getFormString(formData, "professionalId");
  const parsed = professionalSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    bio: formData.get("bio")
  });

  if (!professionalId) {
    return { ok: false, error: "Profissional nao encontrado." };
  }

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Revise os dados do profissional."
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("professionals")
    .update({
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      bio: parsed.data.bio || null,
      is_active: formData.get("isActive") === "on"
    })
    .eq("id", professionalId)
    .eq("organization_id", organization.id);

  if (error) {
    console.error("updateProfessionalStateAction", error);
    return {
      ok: false,
      error: "Nao foi possivel salvar o profissional. Tente novamente."
    };
  }

  revalidatePath("/agenda");
  return { ok: true, message: "Profissional atualizado." };
}

export async function archiveProfessionalStateAction(
  previousState: ProfessionalActionState = initialProfessionalState,
  formData: FormData
): Promise<ProfessionalActionState> {
  void previousState;
  const { organization, state } = await getOrganizationOrState();
  if (!organization) return state;

  const professionalId = getFormString(formData, "professionalId");
  const confirmed = formData.get("confirmArchive") === "on";

  if (!professionalId) {
    return { ok: false, error: "Profissional nao encontrado." };
  }

  if (!confirmed) {
    return { ok: false, error: "Marque a confirmacao antes de arquivar." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("professionals")
    .update({ is_active: false })
    .eq("id", professionalId)
    .eq("organization_id", organization.id);

  if (error) {
    console.error("archiveProfessionalStateAction", error);
    return {
      ok: false,
      error: "Nao foi possivel arquivar o profissional. Tente novamente."
    };
  }

  revalidatePath("/agenda");
  return { ok: true, message: "Profissional arquivado." };
}

export async function createAvailabilityRuleAction(formData: FormData) {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);
  if (!organization) throw new Error("Cadastre uma empresa antes de criar horarios.");

  const parsed = availabilityRuleSchema.safeParse({
    professionalId: formData.get("professionalId"),
    weekday: formData.get("weekday"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime")
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Dados invalidos.");

  const supabase = await createClient();
  const { error } = await supabase.from("availability_rules").insert({
    organization_id: organization.id,
    professional_id: parsed.data.professionalId || null,
    weekday: parsed.data.weekday,
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime
  });

  if (error) throw new Error("Nao foi possivel criar o horario.");
  revalidatePath("/agenda");
}

export async function saveSchedulingSettingsAction(formData: FormData) {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);
  if (!organization) throw new Error("Cadastre uma empresa antes de configurar a agenda.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      timezone: getFormString(formData, "timezone") || "America/Sao_Paulo",
      default_appointment_margin_minutes: Number(formData.get("defaultMarginMinutes") ?? 10),
      booking_min_notice_minutes: Number(formData.get("minNoticeMinutes") ?? 120),
      booking_max_days_ahead: Number(formData.get("maxDaysAhead") ?? 30),
      booking_slot_interval_minutes: Number(formData.get("slotIntervalMinutes") ?? 15),
      booking_slot_mode: getFormString(formData, "slotMode") || "FIXED_GRID",
      booking_confirmation_mode: getFormString(formData, "confirmationMode") || "AUTOMATIC",
      quiet_hours_start: getFormString(formData, "quietStart") || "21:00",
      quiet_hours_end: getFormString(formData, "quietEnd") || "08:00",
      quiet_hours_policy: getFormString(formData, "quietPolicy") || "DELAY",
      updated_at: new Date().toISOString()
    })
    .eq("id", organization.id);

  if (error) {
    console.error("saveSchedulingSettingsAction", error);
    throw new Error("Nao foi possivel salvar as configuracoes da agenda.");
  }

  revalidatePath("/agenda");
  revalidatePath(`/p/${organization.slug}`);
}

export async function createBlockedTimeAction(formData: FormData) {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);
  if (!organization) throw new Error("Cadastre uma empresa antes de bloquear horarios.");

  const date = getFormString(formData, "date");
  const startTime = getFormString(formData, "startTime") || "00:00";
  const endTime = getFormString(formData, "endTime") || "23:59";

  if (!date) throw new Error("Informe a data do bloqueio.");

  const supabase = await createClient();
  const { error } = await supabase.from("blocked_times").insert({
    organization_id: organization.id,
    professional_id: getFormString(formData, "professionalId") || null,
    starts_at: new Date(`${date}T${startTime}:00`).toISOString(),
    ends_at: new Date(`${date}T${endTime}:00`).toISOString(),
    reason: getFormString(formData, "reason") || null,
    block_type: getFormString(formData, "blockType") || "MANUAL"
  });

  if (error) {
    console.error("createBlockedTimeAction", error);
    throw new Error("Nao foi possivel criar o bloqueio.");
  }

  revalidatePath("/agenda");
  revalidatePath(`/p/${organization.slug}`);
}

export async function requestAppointmentAction(formData: FormData) {
  const holdId = getFormString(formData, "holdId");
  const sessionToken = getFormString(formData, "sessionToken");

  if (holdId && sessionToken) {
    const parsed = appointmentSchema.pick({
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      notes: true
    }).safeParse({
      customerName: formData.get("customerName"),
      customerEmail: formData.get("customerEmail"),
      customerPhone: formData.get("customerPhone"),
      notes: formData.get("notes")
    });

    if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Dados invalidos.");

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("confirm_public_appointment_from_hold", {
      p_hold_id: holdId,
      p_session_token: sessionToken,
      p_customer_name: parsed.data.customerName,
      p_customer_email: parsed.data.customerEmail || "",
      p_customer_phone: parsed.data.customerPhone,
      p_notes: parsed.data.notes || "",
      p_consent_whatsapp: formData.get("consentWhatsapp") === "on",
      p_consent_origin: "public_showcase"
    });

    if (error) {
      console.error("confirm_public_appointment_from_hold", error);
      throw new Error("Nao foi possivel confirmar esse horario agora.");
    }

    const result = data as { ok?: boolean; error?: string; public_token?: string };
    if (!result?.ok || !result.public_token) {
      throw new Error(result?.error ?? "Esse horario nao esta mais disponivel.");
    }

    redirect(`/agendamento-recebido?token=${result.public_token}`);
  }

  const parsed = appointmentSchema.safeParse({
    organizationId: formData.get("organizationId"),
    serviceId: formData.get("serviceId"),
    professionalId: formData.get("professionalId"),
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    customerPhone: formData.get("customerPhone"),
    date: formData.get("date"),
    time: formData.get("time"),
    notes: formData.get("notes")
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Dados invalidos.");

  const startsAt = new Date(`${parsed.data.date}T${parsed.data.time}:00`);
  const endsAt = new Date(startsAt);
  endsAt.setMinutes(endsAt.getMinutes() + 60);

  const supabase = await createClient();
  const { error } = await supabase.from("appointments").insert({
    organization_id: parsed.data.organizationId,
    service_id: parsed.data.serviceId || null,
    professional_id: parsed.data.professionalId || null,
    customer_name: parsed.data.customerName,
    customer_email: parsed.data.customerEmail || null,
    customer_phone: parsed.data.customerPhone,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    occupied_starts_at: startsAt.toISOString(),
    occupied_ends_at: endsAt.toISOString(),
    notes: parsed.data.notes || null
  });

  if (error) throw new Error("Nao foi possivel solicitar o agendamento.");
  redirect("/agendamento-recebido");
}
