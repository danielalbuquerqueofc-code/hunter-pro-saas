import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

type AsaasWebhookPayload = {
  id?: string;
  event?: string;
  payment?: {
    id?: string;
    customer?: string;
    subscription?: string;
    status?: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
    value?: number;
    netValue?: number;
    paymentDate?: string;
    confirmedDate?: string;
    dueDate?: string;
    externalReference?: string;
  };
  subscription?: {
    id?: string;
    customer?: string;
    status?: string;
    externalReference?: string;
  };
};

function statusFromAsaasEvent(event: string) {
  if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED_IN_CASH") {
    return "ACTIVE";
  }
  if (event === "PAYMENT_OVERDUE") return "PAST_DUE";
  if (
    event === "PAYMENT_DELETED" ||
    event === "PAYMENT_REFUNDED" ||
    event === "SUBSCRIPTION_DELETED" ||
    event === "SUBSCRIPTION_INACTIVATED"
  ) {
    return "CANCELED";
  }
  return null;
}

function eventEntity(payload: AsaasWebhookPayload) {
  return payload.payment ?? payload.subscription ?? null;
}

export async function POST(request: Request) {
  if (!env.asaasWebhookToken) {
    return NextResponse.json({ ok: false, error: "ASAAS_WEBHOOK_TOKEN nao configurado." }, { status: 503 });
  }

  const token = request.headers.get("asaas-access-token");
  if (token !== env.asaasWebhookToken) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as AsaasWebhookPayload | null;
  if (!payload?.id || !payload.event) {
    return NextResponse.json({ ok: false, error: "Evento Asaas invalido." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const entity = eventEntity(payload);
  const subscriptionId = payload.payment?.subscription || payload.subscription?.id || "";
  const paymentId = payload.payment?.id || "";
  const customerId = entity?.customer || "";
  const mappedStatus = statusFromAsaasEvent(payload.event);

  const { data: existingEvent } = await supabase
    .from("billing_events")
    .select("id,status")
    .eq("provider", "ASAAS")
    .eq("event_id", payload.id)
    .maybeSingle();

  if (existingEvent) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  let organizationId: string | null = null;
  let localSubscriptionId: string | null = null;

  if (subscriptionId || paymentId || customerId) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id,organization_id")
      .or([
        subscriptionId ? `asaas_subscription_id.eq.${subscriptionId}` : "",
        paymentId ? `asaas_payment_id.eq.${paymentId}` : "",
        customerId ? `asaas_customer_id.eq.${customerId}` : ""
      ].filter(Boolean).join(","))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    organizationId = subscription?.organization_id ?? null;
    localSubscriptionId = subscription?.id ?? null;
  }

  const { data: insertedEvent, error: insertError } = await supabase
    .from("billing_events")
    .insert({
      organization_id: organizationId,
      subscription_id: localSubscriptionId,
      provider: "ASAAS",
      event_id: payload.id,
      event_type: payload.event,
      status: "RECEIVED",
      payload
    })
    .select("id")
    .maybeSingle();

  if (insertError) {
    return NextResponse.json({ ok: false, error: "Nao foi possivel registrar webhook Asaas." }, { status: 500 });
  }

  try {
    if (localSubscriptionId) {
      const update: Record<string, unknown> = {
        asaas_status: payload.payment?.status ?? payload.subscription?.status ?? payload.event,
        provider_payload: payload
      };

      if (paymentId) update.asaas_payment_id = paymentId;
      if (payload.payment?.invoiceUrl) update.asaas_invoice_url = payload.payment.invoiceUrl;
      if (payload.payment?.bankSlipUrl) update.asaas_bank_slip_url = payload.payment.bankSlipUrl;
      if (mappedStatus) {
        update.status = mappedStatus;
        update.last_payment_status = payload.event;
      }
      if (mappedStatus === "ACTIVE") update.last_payment_at = new Date().toISOString();

      await supabase.from("subscriptions").update(update).eq("id", localSubscriptionId);
    }

    if (organizationId && mappedStatus) {
      await supabase
        .from("organizations")
        .update({
          billing_provider: "ASAAS",
          subscription_status: mappedStatus,
          access_status: mappedStatus === "PAST_DUE" ? "trial_expired" : mappedStatus === "CANCELED" ? "cancelled" : "active",
          status: mappedStatus === "ACTIVE" ? "ACTIVE" : "SUSPENDED",
          blocked_reason: mappedStatus === "ACTIVE" ? null : `Status Asaas: ${payload.event}`
        })
        .eq("id", organizationId);
    }

    await supabase
      .from("billing_events")
      .update({ status: "PROCESSED", processed_at: new Date().toISOString() })
      .eq("id", insertedEvent?.id);
  } catch (error) {
    await supabase
      .from("billing_events")
      .update({
        status: "FAILED",
        error_message: error instanceof Error ? error.message.slice(0, 500) : "Erro desconhecido"
      })
      .eq("id", insertedEvent?.id);

    return NextResponse.json({ ok: false, error: "Webhook recebido, mas nao processado." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "Use POST para webhooks do Asaas." }, { status: 405 });
}
