import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function assertIncludes(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`Integration readiness check failed: ${label}`);
  }
}

const env = read("lib/env.ts");
const asaas = read("lib/asaas.ts");
const asaasWebhook = read("app/api/webhooks/asaas/route.ts");
const billingActions = read("features/billing/actions.ts");
const billingPage = read("app/(app)/plano-assinatura/page.tsx");
const availabilityRoute = read("app/api/public/availability/route.ts");
const googleBusy = read("features/scheduling/google-busy.ts");
const googleCalendar = read("features/integrations/google-calendar.ts");
const migration = read("supabase/migrations/0013_asaas_billing_readiness.sql");
const migration18 = read("supabase/migrations/0018_essential_integrations_showcase_payments.sql");
const guide = read("PREPARACAO-INTEGRACOES-REAIS.md");

assertIncludes(env, "asaasApiKey", "Asaas API key env is registered");
assertIncludes(env, "asaasWebhookToken", "Asaas webhook token env is registered");
assertIncludes(env, "metaWhatsappAccessToken", "Meta WhatsApp env placeholders are registered");
assertIncludes(env, "googleClientId", "Google Calendar OAuth env placeholders are registered");
assertIncludes(asaas, "https://api-sandbox.asaas.com/v3", "Asaas sandbox base URL is correct");
assertIncludes(asaas, "https://api.asaas.com/v3", "Asaas production base URL is correct");
assertIncludes(asaas, "access_token", "Asaas API uses the documented access_token header");
assertIncludes(asaasWebhook, "asaas-access-token", "Asaas webhook validates the documented token header");
assertIncludes(asaasWebhook, "billing_events", "Asaas webhook stores idempotent billing events");
assertIncludes(asaasWebhook, "PAYMENT_OVERDUE", "Asaas webhook handles overdue payments");
assertIncludes(billingActions, "createAsaasSubscription", "billing action can create Asaas subscriptions");
assertIncludes(billingActions, "provider === \"asaas\"", "billing action is provider-aware");
assertIncludes(billingPage, "billingProvider", "billing page displays provider readiness");
assertIncludes(availabilityRoute, "getGoogleCalendarBusyTimes", "public availability route must call Google Calendar busy lookup");
assertIncludes(googleBusy, "google_calendar_connections", "Google busy lookup must read connected calendars");
assertIncludes(googleBusy, "getValidGoogleAccessToken", "Google busy lookup uses secure OAuth token resolution");
assertIncludes(googleBusy, "freeBusy", "Google busy lookup calls the official freeBusy endpoint");
assertIncludes(googleCalendar, "o/oauth2/v2/auth", "Google Calendar OAuth connect URL is implemented");
assertIncludes(googleCalendar, "encryptSecret", "Google Calendar tokens are encrypted server-side");
assertIncludes(migration, "billing_events", "billing events table migration exists");
assertIncludes(migration, "asaas_subscription_id", "Asaas subscription tracking columns exist");
assertIncludes(migration18, "organization_payment_settings", "company Pix and bank settings table exists");
assertIncludes(guide, "https://prospectorads.com/api/webhooks/asaas", "setup guide documents Asaas webhook URL");

console.log("Integration readiness checks passed.");
