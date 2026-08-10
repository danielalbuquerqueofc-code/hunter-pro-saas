import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireOrganizationAccess } from "@/features/organizations/guards";
import { hasAsaasEnv } from "@/lib/asaas";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${connected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
      {connected ? "Conectado" : "Pendente"}
    </span>
  );
}

export default async function IntegracoesPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER"]);
  const supabase = await createClient();
  const [{ data: googleConnection }, { data: integrations }] = await Promise.all([
    supabase
      .from("google_calendar_connections")
      .select("status,calendar_id,selected_calendar_summary,last_sync_at,last_error")
      .eq("organization_id", organization.id)
      .is("professional_id", null)
      .maybeSingle(),
    supabase
      .from("integrations")
      .select("provider,status,public_config,last_error,connected_at")
      .eq("organization_id", organization.id)
  ]);
  const whatsappReady = Boolean(env.metaWhatsappPhoneNumberId && env.metaWhatsappAccessToken) || Boolean(env.whatsappProviderUrl && env.whatsappProviderToken);
  const asaasReady = hasAsaasEnv();

  return (
    <>
      <AppHeader title="Integracoes" eyebrow="Conexoes reais" />
      <section className="grid gap-5 p-5 pb-28 lg:grid-cols-3 lg:p-8">
        {query.error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 lg:col-span-3">{query.error}</div> : null}
        {query.success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700 lg:col-span-3">Integracao atualizada com sucesso.</div> : null}

        <Card className="rounded-3xl">
          <CardContent className="grid gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Google Calendar</h2>
                <p className="mt-1 text-sm text-zinc-500">Autoriza via OAuth, bloqueia horarios ocupados e prepara sincronizacao de eventos.</p>
              </div>
              <StatusBadge connected={googleConnection?.status === "CONNECTED"} />
            </div>
            <div className="rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-600">
              <p><strong>Calendario:</strong> {googleConnection?.selected_calendar_summary ?? googleConnection?.calendar_id ?? "Nao conectado"}</p>
              <p><strong>Ultima sincronizacao:</strong> {googleConnection?.last_sync_at ? new Date(googleConnection.last_sync_at).toLocaleString("pt-BR") : "-"}</p>
              {googleConnection?.last_error ? <p className="text-red-600"><strong>Erro:</strong> {googleConnection.last_error}</p> : null}
            </div>
            <a href="/api/integrations/google-calendar/connect" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-zinc-950 px-5 font-black text-white">
              {googleConnection?.status === "CONNECTED" ? "Reconectar Google" : "Conectar Google Calendar"}
            </a>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardContent className="grid gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">WhatsApp</h2>
                <p className="mt-1 text-sm text-zinc-500">Envio real por Meta Cloud API ou provider HTTP configurado no servidor.</p>
              </div>
              <StatusBadge connected={whatsappReady} />
            </div>
            <p className="rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-600">
              {whatsappReady ? "Provider configurado. Os lembretes sao enviados pelo cron com consentimento do cliente." : "Configure META_WHATSAPP_PHONE_NUMBER_ID e META_WHATSAPP_ACCESS_TOKEN, ou WHATSAPP_PROVIDER_URL e WHATSAPP_PROVIDER_TOKEN."}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardContent className="grid gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Asaas</h2>
                <p className="mt-1 text-sm text-zinc-500">Cobranca recorrente dos planos Hunter Pro por assinatura e webhook.</p>
              </div>
              <StatusBadge connected={asaasReady} />
            </div>
            <p className="rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-600">
              {asaasReady ? `Ambiente ${env.asaasEnvironment}. A ativacao financeira depende do webhook do Asaas.` : "Configure ASAAS_API_KEY e ASAAS_WEBHOOK_TOKEN antes de cobrar clientes."}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl lg:col-span-3">
          <CardContent className="p-5">
            <h2 className="text-xl font-black">Registro local</h2>
            <div className="mt-4 grid gap-3">
              {(integrations ?? []).map((integration) => (
                <div key={integration.provider} className="rounded-2xl border border-zinc-200 p-4 text-sm">
                  <p className="font-black">{integration.provider} - {integration.status}</p>
                  <p className="mt-1 text-zinc-500">{integration.last_error ?? "Sem erro registrado."}</p>
                </div>
              ))}
              {!integrations?.length ? <p className="text-sm text-zinc-500">Nenhuma integracao registrada ainda.</p> : null}
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
