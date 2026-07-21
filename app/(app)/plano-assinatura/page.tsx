import { CreditCard, ShieldAlert } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBillingCheckoutAction } from "@/features/billing/actions";
import { getOrganizationAccessState } from "@/features/organizations/access-control";
import { requireOrganizationAccess } from "@/features/organizations/guards";
import { hasStripeEnv } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((value ?? 0) / 100);
}

type PlanoAssinaturaPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function PlanoAssinaturaPage({ searchParams }: PlanoAssinaturaPageProps) {
  const query = await searchParams;
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "FINANCIAL"]);
  const supabase = await createClient();
  const [{ data: subscription }, { data: plans }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("status,current_period_start,current_period_end,stripe_subscription_id,plan:plans(code,name,description,price_cents,stripe_price_id)")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("plans")
      .select("code,name,description,price_cents,stripe_price_id")
      .eq("is_active", true)
      .order("price_cents", { ascending: true })
  ]);
  const plan = Array.isArray(subscription?.plan) ? subscription?.plan[0] : subscription?.plan;
  const access = getOrganizationAccessState(organization);
  const stripeReady = hasStripeEnv();

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
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200 p-4">
                  <p className="text-xs font-black uppercase text-zinc-400">Status</p>
                  <p className="mt-2 font-black">{subscription?.status ?? organization.subscription_status ?? "-"}</p>
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
                <article key={item.code} className="flex min-h-56 flex-col rounded-2xl border border-zinc-200 p-5">
                  <h3 className="text-xl font-black">{item.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{item.description}</p>
                  <p className="mt-auto text-2xl font-black text-brand-orange">{formatCurrency(item.price_cents)}</p>
                  <form action={createBillingCheckoutAction} className="mt-4">
                    <input type="hidden" name="planCode" value={item.code} />
                    <Button
                      type="submit"
                      disabled={!stripeReady || !item.stripe_price_id}
                      className="w-full"
                      variant={item.code === plan?.code ? "secondary" : "default"}
                    >
                      {item.code === plan?.code ? "Plano atual" : "Assinar"}
                    </Button>
                  </form>
                  {!item.stripe_price_id ? (
                    <p className="mt-2 text-xs font-bold text-zinc-400">Configure o stripe_price_id deste plano.</p>
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
                {stripeReady
                  ? "Stripe conectado no servidor. O checkout sera criado somente para planos com stripe_price_id."
                  : "Stripe ainda nao possui STRIPE_SECRET_KEY no ambiente. Nenhum checkout falso foi ativado."}
              </p>
            </CardContent>
          </Card>
        </aside>
      </main>
    </>
  );
}
