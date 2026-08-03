import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

type ReminderJob = {
  id: string;
  organization_id: string;
  appointment_id: string;
  channel: "WHATSAPP" | "EMAIL" | "INTERNAL";
  attempt_count: number;
  max_attempts: number;
  idempotency_key: string;
  payload: Record<string, unknown>;
  appointment: {
    customer_name: string;
    customer_phone: string;
    starts_at: string;
    status_v2: string;
    consent_whatsapp: boolean | null;
    service: { name: string; duration_minutes: number } | null;
    professional: { name: string } | null;
    organization: {
      name: string;
      whatsapp: string | null;
      timezone: string | null;
      status: string;
      access_status: string | null;
      subscription_status: string | null;
      quiet_hours_start: string | null;
      quiet_hours_end: string | null;
      quiet_hours_policy: string | null;
    } | null;
  } | null;
};

function renderWhatsappMessage(job: ReminderJob) {
  const appointment = job.appointment;
  const organization = appointment?.organization;
  const service = appointment?.service;
  const professional = appointment?.professional;
  const date = appointment?.starts_at
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(appointment.starts_at))
    : "";

  return [
    `Ola, ${appointment?.customer_name ?? "cliente"}!`,
    `Seu agendamento na ${organization?.name ?? "empresa"} esta ${appointment?.status_v2 === "confirmed" ? "confirmado" : "aguardando confirmacao"}.`,
    "",
    `Servico: ${service?.name ?? "Servico"}`,
    `Profissional: ${professional?.name ?? "Profissional disponivel"}`,
    `Data: ${date}`,
    `Duracao: ${service?.duration_minutes ?? 60} minutos`,
    "",
    "Enviaremos lembretes antes do atendimento conforme configurado."
  ].join("\n");
}

const BLOCKED_ACCESS_STATUSES = new Set(["suspended", "trial_expired", "blocked", "cancelled"]);
const BLOCKED_APPOINTMENT_STATUSES = new Set(["cancelled_by_customer", "cancelled_by_company", "completed", "no_show"]);

function isValidPhone(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "").length >= 10;
}

function minutesFromTime(value: string | null | undefined) {
  if (!value) return null;
  const [hour, minute] = value.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function getLocalMinutes(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function isWithinQuietHours(job: ReminderJob, now = new Date()) {
  const organization = job.appointment?.organization;
  const start = minutesFromTime(organization?.quiet_hours_start);
  const end = minutesFromTime(organization?.quiet_hours_end);
  if (start === null || end === null || start === end) return false;

  const localMinutes = getLocalMinutes(now, organization?.timezone ?? "America/Fortaleza");
  if (start < end) return localMinutes >= start && localMinutes < end;
  return localMinutes >= start || localMinutes < end;
}

function getSkipReason(job: ReminderJob) {
  const organization = job.appointment?.organization;
  const appointment = job.appointment;

  if (!organization || organization.status !== "ACTIVE") return "Empresa indisponivel.";
  if (BLOCKED_ACCESS_STATUSES.has(organization.access_status ?? "")) return "Acesso da empresa bloqueado.";
  if (organization.subscription_status === "PAST_DUE" || organization.subscription_status === "CANCELED") return "Assinatura indisponivel.";
  if (!appointment || BLOCKED_APPOINTMENT_STATUSES.has(appointment.status_v2) || appointment.status_v2?.startsWith("cancelled")) return "Agendamento indisponivel.";
  if (job.channel === "WHATSAPP" && !appointment.consent_whatsapp) return "Cliente sem consentimento para WhatsApp.";
  if (job.channel === "WHATSAPP" && !isValidPhone(appointment.customer_phone)) return "Telefone do cliente invalido.";
  if (isWithinQuietHours(job)) return "Janela de silencio ativa.";
  return null;
}

async function sendWhatsapp(job: ReminderJob) {
  if (!env.whatsappProviderUrl || !env.whatsappProviderToken) {
    return {
      ok: false,
      skipped: true,
      error: "WHATSAPP_PROVIDER_URL/WHATSAPP_PROVIDER_TOKEN nao configurados."
    };
  }

  const response = await fetch(env.whatsappProviderUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.whatsappProviderToken}`,
      "Idempotency-Key": job.idempotency_key
    },
    body: JSON.stringify({
      to: job.appointment?.customer_phone,
      body: renderWhatsappMessage(job),
      idempotency_key: job.idempotency_key
    })
  });

  const payload = await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    providerMessageId: typeof payload.id === "string" ? payload.id : undefined,
    error: response.ok ? undefined : payload.error || `HTTP ${response.status}`
  };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!env.cronSecret || authHeader !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: jobs, error } = await supabase
    .from("reminder_jobs")
    .select(`
      *,
      appointment:appointments(
        customer_name,
        customer_phone,
        starts_at,
        status_v2,
        consent_whatsapp,
        service:services(name,duration_minutes),
        professional:professionals(name),
        organization:organizations(name,whatsapp,timezone,status,access_status,subscription_status,quiet_hours_start,quiet_hours_end,quiet_hours_policy)
      )
    `)
    .eq("status", "SCHEDULED")
    .lte("scheduled_at", new Date().toISOString())
    .lt("attempt_count", 3)
    .limit(20);

  if (error) {
    console.error("cron reminders load", error.message);
    return NextResponse.json({ ok: false, error: "Nao foi possivel carregar lembretes." }, { status: 500 });
  }

  const processed = [];

  for (const job of (jobs ?? []) as ReminderJob[]) {
    const { data: locked } = await supabase
      .from("reminder_jobs")
      .update({
        status: "PROCESSING",
        processing_started_at: new Date().toISOString(),
        attempt_count: job.attempt_count + 1
      })
      .eq("id", job.id)
      .eq("status", "SCHEDULED")
      .select("id")
      .maybeSingle();

    if (!locked) continue;

    const skipReason = getSkipReason(job);
    if (skipReason) {
      await supabase.from("reminder_jobs").update({ status: "SKIPPED", error_message: skipReason }).eq("id", job.id);
      processed.push({ id: job.id, status: "SKIPPED" });
      continue;
    }

    const result = job.channel === "WHATSAPP" ? await sendWhatsapp(job) : { ok: false, skipped: true, error: "Canal ainda nao configurado." };
    const finalStatus = result.ok ? "SENT" : result.skipped ? "SKIPPED" : job.attempt_count + 1 >= job.max_attempts ? "FAILED" : "SCHEDULED";

    await supabase
      .from("reminder_jobs")
      .update({
        status: finalStatus,
        sent_at: result.ok ? new Date().toISOString() : null,
        provider_message_id: result.providerMessageId ?? null,
        error_message: result.error ?? null
      })
      .eq("id", job.id);

    await supabase.from("whatsapp_message_deliveries").insert({
      organization_id: job.organization_id,
      appointment_id: job.appointment_id,
      reminder_job_id: job.id,
      to_phone: job.appointment?.customer_phone ?? "",
      status: finalStatus,
      provider_message_id: result.providerMessageId ?? null,
      attempt_count: job.attempt_count + 1,
      last_error: result.error ?? null,
      idempotency_key: `delivery:${job.id}:${job.attempt_count + 1}`
    });

    processed.push({ id: job.id, status: finalStatus });
  }

  return NextResponse.json({ ok: true, processed });
}
