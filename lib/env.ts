export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
  whatsappProviderUrl: process.env.WHATSAPP_PROVIDER_URL ?? "",
  whatsappProviderToken: process.env.WHATSAPP_PROVIDER_TOKEN ?? "",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://prospectorads.com",
  billingProvider: process.env.BILLING_PROVIDER ?? "stripe",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePortalReturnUrl: process.env.STRIPE_PORTAL_RETURN_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://prospectorads.com",
  asaasApiKey: process.env.ASAAS_API_KEY ?? "",
  asaasEnvironment: process.env.ASAAS_ENVIRONMENT ?? "sandbox",
  asaasWebhookToken: process.env.ASAAS_WEBHOOK_TOKEN ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleCalendarRedirectUri: process.env.GOOGLE_CALENDAR_REDIRECT_URI ?? "",
  integrationEncryptionKey: process.env.INTEGRATION_ENCRYPTION_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  metaWhatsappPhoneNumberId: process.env.META_WHATSAPP_PHONE_NUMBER_ID ?? "",
  metaWhatsappAccessToken: process.env.META_WHATSAPP_ACCESS_TOKEN ?? "",
  metaWhatsappWebhookVerifyToken: process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? ""
};

export function hasSupabaseEnv() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
