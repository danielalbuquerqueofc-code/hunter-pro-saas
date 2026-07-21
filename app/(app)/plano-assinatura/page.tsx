import { CreditCard, ShieldAlert } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBillingCheckoutAction } from "@/features/billing/actions";
import { formatPlanPrice, getOrganizationPlanUsage } from "@/features/billing/plan-limits";
import { getOrganizationAccessState } from "@/features/organizations/access-control";
import { requireOrganizationAccess } from "@/features/organizations/guards";
import { getAsaasEnvironment, hasAsaasEnv } from "@/lib/asaas";
import { env } from "@/lib/env";
import { hasStripeEnv } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((value ?? 0) / 100);
}

function formatUserLimit(minimumUsers?: number | null, maximumUsers?: number | null) {
  const min = Number(minimumUsers ?? 1);
  const max = Number(maximumUsers ?? 1);
  if (min === max) return `${max} usuario${max === 1 ? "" : "s"}`;
  if (min <= 1) return `Ate ${max} usuarios`;
  return `De ${min} a ${max} usuarios`;
}

type PlanoAssinaturaPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function PlanoAssinaturaPage({ searchParams }: PlanoAssinaturaPageProps) {
  const query = await searchParams;
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "FINANCIAL"]);
  const supabase = await createClient();
  const planUsage = await getOrganizationPlanUsage(supabase, organization.id);
  const [{ data: subscription }, { data: plans }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("status,current_period_start,current_period_end,billing_provider,stripe_subscription_id,asaas_subscription_id,asaas_invoice_url,asaas_status,plan:plans(code,slug,name,description,price_cents,monthly_price,minimum_users,maximum_users,stripe_price_id,billing_provider,asaas_billing_type,asaas_cycle)")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("plans")
      .select("code,slug,name,description,price_cents,monthly_price,minimum_users,maximum_users,stripe_price_id,billing_provider,asaas_billing_type,asaas_cycle,is_featured,display_order")
      .eq("is_active", true)
      .eq("status", "active")
      .is("archived_at", null)
      .order("display_order", { ascending: true })
  ]);
  const plan = Array.isArray(subscription?.plan) ? subscription?.plan[0] : subscription?.plan;
  const access = getOrganizationAccessState(organization);
  const stripeReady = hasStripeEnv();
  const asaasReady = hasAsaasEnv();
  const billingProvider = env.billingProvider.toLowerCase() === "asaas" ? "asaas" : "stripe";
  const providerReady = billingProvider === "asaas" ? asaasReady : stripeReady;
  const providerLabel = billingProvider === "asaas" ? `Asaas ${getAsaasEnvironment()}` : "Stripe";

  return (
    <>
      <AppHeader title="Plano e assinatura" eyebrow="Acesso e cobranca" />
      <main className="grid gap-6 p-5 pb-28 lg:grid-cols-[1fr_380px] lg:p-8">
        <section className="space-y-6">
          {query.error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{query.error}</div>
          ) : null}
          {query.success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              Checkout iniciado/concluido. Se o pagamento foi aprovado, o webhook atualizara sua assinatura.
            </div>
          ) : null}
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-orange" />
                Plano atual
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="rounded-2xl bg-zinc-50 p-5">
                <p className="text-sm font-bold text-zinc-500">Plano</p>
                <h2 className="mt-1 text-3xl font-black text-zinc-950">{plan?.name ?? "Sem plano vinculado"}</h2>
                <p className="mt-2 text-sm text-zinc-600">{plan?.description ?? "Nenhuma assinatura ativa encontrada para esta empresa."}</p>
                <p className="mt-4 text-2xl font-black text-brand-orange">{formatPlanPrice(planUsage.plan)}/mes</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-zinc-200 p-4">
                  <p className="text-xs font-black uppercase text-zinc-400">Status</p>
                  <p className="mt-2 font-black">{subscription?.status ?? organization.subscription_status ?? "-"}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 p-4">
                  <p className="text-xs font-black uppercase text-zinc-400">Usuarios</p>
                  <p className="mt-2 font-black">{planUsage.usedSlots} de {planUsage.maximumUsers}</p>
                  <p className="mt-1 text-xs font-bold text-zinc-500">{planUsage.availableSlots} disponiveis</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 p-4">
                  <p className="text-xs font-black uppercase text-zinc-400">Periodo atual</p>
                  <p className="mt-2 text-sm font-bold">{formatDate(subscription?.current_period_start)} ate {formatDate(subscription?.current_period_end)}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 p-4">
                  <p className="text-xs font-black uppercase text-zinc-400">Teste gratis</p>
                  <p className="mt-2 text-sm font-bold">{formatDate(organization.trial_ends_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Planos disponiveis</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {(plans ?? []).map((item) => (
                <article
                  key={item.code}
                  className={`flex min-h-64 flex-col rounded-2xl border p-5 ${
                    item.code === plan?.code ? "border-brand-orange bg-orange-50/40" : "border-zinc-200 bg-white"
                  }`}
                >
                  {item.is_featured ? (
                    <span className="mb-3 w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Mais escolhido</span>
                  ) : null}
                  <h3 className="text-xl font-black">{item.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{item.description}</p>
                  <div className="mt-auto space-y-2 pt-5">
                    <p className="text-sm font-bold text-zinc-500">{formatUserLimit(item.minimum_users, item.maximum_users)}</p>
                    <p className="text-2xl font-black text-brand-orange">{item.monthly_price ? formatPlanPrice(item) : formatCurrency(item.price_cents)}</p>
                  </div>
                  <form action={createBillingCheckoutAction} className="mt-4">
                    <input type="hidden" name="planCode" value={item.code} />
                    <input type="hidden" name="provider" value={billingProvider} />
                    <Button
                      type="submit"
                      disabled={
                        item.code === plan?.code ||
                        !providerReady ||
                        (billingProvider === "stripe" && !item.stripe_price_id)
                      }
                      className="w-full"
                      variant={item.code === plan?.code ? "secondary" : "default"}
                    >
                      {item.code === plan?.code ? "Plano atual" : "Assinar"}
                    </Button>
                  </form>
                  {billingProvider === "stripe" && !item.stripe_price_id ? (
                    <p className="mt-2 text-xs font-bold text-zinc-400">Configure o stripe_price_id deste plano.</p>
                  ) : null}
                  {billingProvider === "asaas" ? (
                    <p className="mt-2 text-xs font-bold text-zinc-400">
                      Asaas: {item.asaas_billing_type ?? "PIX"} / {item.asaas_cycle ?? "MONTHLY"}.
                    </p>
                  ) : null}
                </article>
              ))}
            </CardContent>
          </Card>
        </section>

        <aside>
          <Card className="rounded-3xl">
            <CardContent className="p-5">
              <ShieldAlert className="h-8 w-8 text-brand-orange" />
              <h2 className="mt-4 text-lg font-black">{access.label}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{access.reason}</p>
              <p className="mt-5 rounded-2xl bg-zinc-50 p-4 text-xs font-bold text-zinc-500">
                {providerReady
                  ? `${providerLabel} conectado no servidor. A cobranca sera criada somente com dados reais.`
                  : `${providerLabel} ainda nao esta configurado no ambiente. Nenhuma cobranca falsa foi ativada.`}
              </p>
              {subscription?.asaas_invoice_url ? (
                <a
                  href={subscription.asaas_invoice_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-orange px-4 text-sm font-black text-white"
                >
                  Abrir cobranca Asaas
                </a>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </main>
    </>
  );
}
