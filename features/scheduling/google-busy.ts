import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SchedulingBusy } from "@/features/scheduling/availability";
import { getValidGoogleAccessToken } from "@/features/integrations/google-calendar";

type GoogleConnection = {
  id: string;
  organization_id: string;
  professional_id: string | null;
  status: string;
  calendar_id: string | null;
  blocks_availability: boolean;
  access_token_encrypted: string | null;
};

type GoogleBusyParams = {
  organizationId: string;
  professionalIds: string[];
  startsAt: string;
  endsAt: string;
};

export async function getGoogleCalendarBusyTimes({
  organizationId,
  professionalIds,
  startsAt,
  endsAt
}: GoogleBusyParams): Promise<SchedulingBusy[]> {
  if (!env.googleClientId || !env.googleClientSecret) return [];
  if (!professionalIds.length) return [];

  const supabase = createAdminClient();
  const { data: connections, error } = await supabase
    .from("google_calendar_connections")
    .select("id,organization_id,professional_id,status,calendar_id,blocks_availability,access_token_encrypted")
    .eq("organization_id", organizationId)
    .eq("status", "CONNECTED")
    .eq("blocks_availability", true)
    .or(`professional_id.is.null,professional_id.in.(${professionalIds.join(",")})`);

  if (error) {
    console.error("google busy connections", error.message);
    return [];
  }

  const activeConnections = ((connections ?? []) as GoogleConnection[]).filter((connection) => connection.calendar_id && connection.access_token_encrypted);
  if (!activeConnections.length) return [];

  const busyTimes: SchedulingBusy[] = [];

  for (const connection of activeConnections) {
    try {
      const token = await getValidGoogleAccessToken(connection.id);
      if (!token || !connection.calendar_id) continue;

      const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          timeMin: startsAt,
          timeMax: endsAt,
          items: [{ id: connection.calendar_id }]
        })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error?.message || `Google Calendar HTTP ${response.status}`);
      }

      const busy = payload?.calendars?.[connection.calendar_id]?.busy ?? [];
      for (const item of busy as Array<{ start?: string; end?: string }>) {
        if (!item.start || !item.end) continue;
        busyTimes.push({
          professional_id: connection.professional_id,
          starts_at: item.start,
          ends_at: item.end
        });
      }

      await supabase
        .from("google_calendar_connections")
        .update({ last_sync_at: new Date().toISOString(), last_error: null })
        .eq("id", connection.id);
    } catch (error) {
      await supabase
        .from("google_calendar_connections")
        .update({
          last_sync_at: new Date().toISOString(),
          last_error: error instanceof Error ? error.message : "Falha ao consultar Google Calendar."
        })
        .eq("id", connection.id);
    }
  }

  return busyTimes;
}
