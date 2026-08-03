import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SchedulingBusy } from "@/features/scheduling/availability";

type GoogleConnection = {
  id: string;
  organization_id: string;
  professional_id: string | null;
  status: string;
  calendar_id: string | null;
  blocks_availability: boolean;
  secret_ref: string | null;
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
    .select("id,organization_id,professional_id,status,calendar_id,blocks_availability,secret_ref")
    .eq("organization_id", organizationId)
    .eq("status", "CONNECTED")
    .eq("blocks_availability", true)
    .or(`professional_id.is.null,professional_id.in.(${professionalIds.join(",")})`);

  if (error) {
    console.error("google busy connections", error.message);
    return [];
  }

  const activeConnections = ((connections ?? []) as GoogleConnection[]).filter((connection) => connection.calendar_id && connection.secret_ref);
  if (!activeConnections.length) return [];

  await Promise.all(
    activeConnections.map((connection) =>
      supabase
        .from("google_calendar_connections")
        .update({
          last_sync_at: new Date().toISOString(),
          last_error: "Consulta busy aguardando resolvedor seguro de token OAuth."
        })
        .eq("id", connection.id)
    )
  );

  console.error("Google Calendar busy lookup skipped: OAuth token resolver is not configured.", {
    organizationId,
    startsAt,
    endsAt
  });

  return [];
}
