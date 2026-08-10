import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { decryptSecret, encryptSecret } from "@/lib/server-crypto";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const SCOPES = ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/calendar.readonly"];

type GoogleState = {
  organizationId: string;
  userId: string;
  nonce: string;
  issuedAt: number;
};

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  token_type: string;
};

type GoogleCalendarListResponse = {
  items?: Array<{
    id: string;
    summary?: string;
    primary?: boolean;
    accessRole?: string;
  }>;
};

function getGoogleRedirectUri() {
  return env.googleCalendarRedirectUri || `${env.appUrl.replace(/\/$/, "")}/api/integrations/google-calendar/callback`;
}

function sign(value: string) {
  return createHmac("sha256", env.integrationEncryptionKey || env.supabaseServiceRoleKey).update(value).digest("base64url");
}

function encodeState(payload: GoogleState) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeGoogleState(value: string): GoogleState | null {
  const [body, signature] = value.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as GoogleState;
    if (!payload.organizationId || !payload.userId || Date.now() - payload.issuedAt > 10 * 60 * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export function buildGoogleCalendarAuthUrl(organizationId: string, userId: string) {
  if (!env.googleClientId) throw new Error("GOOGLE_CLIENT_ID nao configurado.");

  const state = encodeState({
    organizationId,
    userId,
    nonce: randomBytes(16).toString("base64url"),
    issuedAt: Date.now()
  });
  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES.join(" "),
    state
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCalendarCode(code: string) {
  if (!env.googleClientId || !env.googleClientSecret) {
    throw new Error("Credenciais do Google Calendar nao configuradas.");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      redirect_uri: getGoogleRedirectUri(),
      grant_type: "authorization_code"
    })
  });
  const payload = (await response.json().catch(() => ({}))) as Partial<GoogleTokenResponse> & { error_description?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || "Nao foi possivel autorizar o Google Calendar.");
  }
  return payload as GoogleTokenResponse;
}

export async function refreshGoogleCalendarAccessToken(refreshToken: string) {
  if (!env.googleClientId || !env.googleClientSecret) {
    throw new Error("Credenciais do Google Calendar nao configuradas.");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      grant_type: "refresh_token"
    })
  });
  const payload = (await response.json().catch(() => ({}))) as Partial<GoogleTokenResponse> & { error_description?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || "Nao foi possivel renovar o Google Calendar.");
  }
  return payload as GoogleTokenResponse;
}

export async function listGoogleCalendars(accessToken: string) {
  const response = await fetch(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const payload = (await response.json().catch(() => ({}))) as GoogleCalendarListResponse & { error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message || "Nao foi possivel listar calendarios.");
  return payload.items ?? [];
}

export async function getValidGoogleAccessToken(connectionId: string) {
  const supabase = createAdminClient();
  const { data: connection } = await supabase
    .from("google_calendar_connections")
    .select("id,access_token_encrypted,refresh_token_encrypted,access_token_expires_at")
    .eq("id", connectionId)
    .maybeSingle();

  if (!connection?.access_token_encrypted) return null;

  const expiresAt = connection.access_token_expires_at ? new Date(connection.access_token_expires_at).getTime() : 0;
  if (expiresAt > Date.now() + 60_000) return decryptSecret(connection.access_token_encrypted);

  const refreshToken = decryptSecret(connection.refresh_token_encrypted);
  if (!refreshToken) return decryptSecret(connection.access_token_encrypted);

  const refreshed = await refreshGoogleCalendarAccessToken(refreshToken);
  const expires = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  await supabase
    .from("google_calendar_connections")
    .update({
      access_token_encrypted: encryptSecret(refreshed.access_token),
      access_token_expires_at: expires,
      last_error: null
    })
    .eq("id", connectionId);

  return refreshed.access_token;
}

export async function upsertGoogleCalendarConnection(input: {
  organizationId: string;
  userId: string;
  tokens: GoogleTokenResponse;
}) {
  const supabase = createAdminClient();
  const calendars = await listGoogleCalendars(input.tokens.access_token);
  const selectedCalendar = calendars.find((calendar) => calendar.primary) ?? calendars[0];
  if (!selectedCalendar?.id) throw new Error("Nenhum calendario Google disponivel para sincronizar.");

  const expiresAt = new Date(Date.now() + input.tokens.expires_in * 1000).toISOString();
  const scopes = input.tokens.scope ? input.tokens.scope.split(" ") : SCOPES;

  const connectionPayload = {
    organization_id: input.organizationId,
    professional_id: null,
    provider: "GOOGLE_CALENDAR",
    status: "CONNECTED",
    google_account_email: null,
    calendar_id: selectedCalendar.id,
    selected_calendar_summary: selectedCalendar.summary ?? selectedCalendar.id,
    blocks_availability: true,
    access_token_encrypted: encryptSecret(input.tokens.access_token),
    refresh_token_encrypted: input.tokens.refresh_token ? encryptSecret(input.tokens.refresh_token) : null,
    access_token_expires_at: expiresAt,
    scopes,
    connected_at: new Date().toISOString(),
    disconnected_at: null,
    last_sync_at: new Date().toISOString(),
    last_error: null
  };
  const { data: existingConnection } = await supabase
    .from("google_calendar_connections")
    .select("id")
    .eq("organization_id", input.organizationId)
    .is("professional_id", null)
    .maybeSingle();

  if (existingConnection?.id) {
    await supabase.from("google_calendar_connections").update(connectionPayload).eq("id", existingConnection.id);
  } else {
    await supabase.from("google_calendar_connections").insert(connectionPayload);
  }

  const integrationPayload = {
    organization_id: input.organizationId,
    provider: "GOOGLE_CALENDAR",
    status: "CONNECTED",
    public_config: {
      calendar_id: selectedCalendar.id,
      calendar_name: selectedCalendar.summary ?? selectedCalendar.id
    },
    protected_config: {},
    connected_at: new Date().toISOString(),
    disconnected_at: null,
    last_error: null
  };
  const { data: existingIntegration } = await supabase
    .from("integrations")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("provider", "GOOGLE_CALENDAR")
    .maybeSingle();

  if (existingIntegration?.id) {
    await supabase.from("integrations").update(integrationPayload).eq("id", existingIntegration.id);
  } else {
    await supabase.from("integrations").insert(integrationPayload);
  }
}

export async function syncGoogleCalendarAppointmentByPublicToken(publicToken: string) {
  const supabase = createAdminClient();
  const { data: appointment } = await supabase
    .from("appointments")
    .select(`
      id,
      organization_id,
      professional_id,
      customer_name,
      customer_phone,
      customer_email,
      starts_at,
      ends_at,
      occupied_ends_at,
      notes,
      google_event_id,
      organization:organizations(name,slug,address,city,state),
      service:services(name,duration_minutes),
      professional:professionals(name)
    `)
    .eq("public_token", publicToken)
    .maybeSingle();

  if (!appointment) return;

  const { data: connection } = await supabase
    .from("google_calendar_connections")
    .select("id,calendar_id,status")
    .eq("organization_id", appointment.organization_id)
    .eq("status", "CONNECTED")
    .or(`professional_id.eq.${appointment.professional_id},professional_id.is.null`)
    .order("professional_id", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (!connection?.calendar_id) {
    await supabase.from("appointments").update({ google_sync_status: "SKIPPED", google_last_error: "Google Calendar nao conectado." }).eq("id", appointment.id);
    return;
  }

  try {
    const accessToken = await getValidGoogleAccessToken(connection.id);
    if (!accessToken) throw new Error("Token do Google Calendar indisponivel.");

    const service = Array.isArray(appointment.service) ? appointment.service[0] : appointment.service;
    const professional = Array.isArray(appointment.professional) ? appointment.professional[0] : appointment.professional;
    const organization = Array.isArray(appointment.organization) ? appointment.organization[0] : appointment.organization;
    const eventBody = {
      summary: `${service?.name ?? "Atendimento"} - ${appointment.customer_name}`,
      description: [
        `Cliente: ${appointment.customer_name}`,
        `Telefone: ${appointment.customer_phone ?? ""}`,
        `E-mail: ${appointment.customer_email ?? ""}`,
        `Servico: ${service?.name ?? ""}`,
        `Profissional: ${professional?.name ?? ""}`,
        `Observacoes: ${appointment.notes ?? ""}`,
        `Origem: Hunter Pro`,
        `ID interno: ${appointment.id}`
      ].filter(Boolean).join("\n"),
      location: [organization?.address, organization?.city, organization?.state].filter(Boolean).join(", "),
      start: { dateTime: appointment.starts_at },
      end: { dateTime: appointment.occupied_ends_at ?? appointment.ends_at },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 1440 },
          { method: "popup", minutes: 120 }
        ]
      },
      extendedProperties: {
        private: {
          hunter_pro_appointment_id: appointment.id
        }
      }
    };
    const method = appointment.google_event_id ? "PATCH" : "POST";
    const endpoint = appointment.google_event_id
      ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendar_id)}/events/${encodeURIComponent(appointment.google_event_id)}`
      : `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendar_id)}/events`;
    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(eventBody)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error?.message || `Google Calendar HTTP ${response.status}`);

    await supabase
      .from("appointments")
      .update({
        google_calendar_id: connection.calendar_id,
        google_event_id: payload.id ?? appointment.google_event_id,
        google_sync_status: "SYNCED",
        google_last_sync_at: new Date().toISOString(),
        google_last_error: null
      })
      .eq("id", appointment.id);
  } catch (error) {
    await supabase
      .from("appointments")
      .update({
        google_sync_status: "PENDING",
        google_last_error: error instanceof Error ? error.message : "Falha ao sincronizar Google Calendar.",
        google_attempt_count: 1
      })
      .eq("id", appointment.id);
  }
}
