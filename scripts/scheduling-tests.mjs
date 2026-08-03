import { readFileSync } from "node:fs";
import { join } from "node:path";

const availabilityFile = readFileSync(join(process.cwd(), "features/scheduling/availability.ts"), "utf8");
const storefrontFile = readFileSync(join(process.cwd(), "features/showcase/public-storefront.tsx"), "utf8");
const migrationFile = readFileSync(join(process.cwd(), "supabase/migrations/0011_scheduling_availability_automations.sql"), "utf8");

function assertIncludes(content, expected, label) {
  if (!content.includes(expected)) throw new Error(`Scheduling check failed: ${label}`);
}

assertIncludes(availabilityFile, "margins.total", "total occupation uses service duration plus margin");
assertIncludes(availabilityFile, "SEQUENTIAL_BLOCKS", "sequential blocks mode exists");
assertIncludes(availabilityFile, "FIXED_GRID", "fixed grid mode exists");
assertIncludes(availabilityFile, "minute + margins.before + service.duration_minutes + margins.after <= turnEnd", "service must fit inside one turn");
assertIncludes(availabilityFile, "blockedTimes", "pauses/vacations/holidays block slots");
assertIncludes(availabilityFile, "googleBusy", "Google busy blocks are supported by the algorithm");
assertIncludes(availabilityFile, "America/Fortaleza", "availability must use an explicit Brazil timezone fallback");
assertIncludes(availabilityFile, "getTimezoneOffsetMs", "availability must convert organization local time to UTC");
assertIncludes(storefrontFile, "/api/public/availability", "public showcase loads server-side availability");
assertIncludes(storefrontFile, "/api/public/holds", "public showcase creates temporary holds");
assertIncludes(storefrontFile, "consentWhatsapp", "WhatsApp consent is captured");
assertIncludes(migrationFile, "appointment_holds", "temporary hold table exists");
assertIncludes(migrationFile, "confirm_public_appointment_from_hold", "transactional confirmation function exists");
assertIncludes(migrationFile, "reminder_jobs", "reminder jobs table exists");
assertIncludes(migrationFile, "google_calendar_connections", "Google Calendar connection table exists");
assertIncludes(migrationFile, "whatsapp_message_deliveries", "WhatsApp delivery log table exists");

console.log("Scheduling checks passed.");
