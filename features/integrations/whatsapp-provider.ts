import { env } from "@/lib/env";

type SendWhatsappInput = {
  to: string | null | undefined;
  body: string;
  idempotencyKey: string;
};

type SendWhatsappResult = {
  ok: boolean;
  skipped?: boolean;
  provider?: "META_CLOUD_API" | "HTTP_PROVIDER";
  providerMessageId?: string;
  error?: string;
};

function phoneDigits(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export function hasWhatsappProvider() {
  return Boolean(
    (env.metaWhatsappPhoneNumberId && env.metaWhatsappAccessToken) ||
      (env.whatsappProviderUrl && env.whatsappProviderToken)
  );
}

export async function sendWhatsappText(input: SendWhatsappInput): Promise<SendWhatsappResult> {
  const to = phoneDigits(input.to);
  if (to.length < 12) {
    return { ok: false, skipped: true, error: "Telefone do cliente invalido." };
  }

  if (env.metaWhatsappPhoneNumberId && env.metaWhatsappAccessToken) {
    const response = await fetch(`https://graph.facebook.com/v21.0/${env.metaWhatsappPhoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.metaWhatsappAccessToken}`
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: false, body: input.body }
      })
    });
    const payload = await response.json().catch(() => ({}));
    const providerMessageId = Array.isArray(payload.messages) ? payload.messages[0]?.id : undefined;

    return {
      ok: response.ok,
      provider: "META_CLOUD_API",
      providerMessageId,
      error: response.ok ? undefined : payload?.error?.message || `Meta WhatsApp HTTP ${response.status}`
    };
  }

  if (env.whatsappProviderUrl && env.whatsappProviderToken) {
    const response = await fetch(env.whatsappProviderUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.whatsappProviderToken}`,
        "Idempotency-Key": input.idempotencyKey
      },
      body: JSON.stringify({
        to,
        body: input.body,
        idempotency_key: input.idempotencyKey
      })
    });
    const payload = await response.json().catch(() => ({}));

    return {
      ok: response.ok,
      provider: "HTTP_PROVIDER",
      providerMessageId: typeof payload.id === "string" ? payload.id : undefined,
      error: response.ok ? undefined : payload.error || `WhatsApp provider HTTP ${response.status}`
    };
  }

  return {
    ok: false,
    skipped: true,
    error: "WhatsApp oficial ou provider HTTP nao configurado."
  };
}
