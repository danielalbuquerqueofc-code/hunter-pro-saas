import { CreditCard, ShieldAlert } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrganizationAccessState } from "@/features/organizations/access-control";
import { requireOrganizationAccess } from "@/features/organizations/guards";
import { createClient } from "@/lib/supabase/server";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((value ?? 0) / 100);
}

export default async function PlanoAssinaturaPage() {
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "FINANCIAL"]);
  const supabase = await createClient();
  const [{ data: subscription }, { data: plans }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("status,current_period_start,current_period_end,plan:plans(code,name,description,price_cents)")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("plans")
      .select("code,name,description,price_cents")
      .eq("is_active", true)
      .order("price_cents", { ascending: true })
  ]);
  const plan = Array.isArray(subscription?.plan) ? subscription?.plan[0] : subscription?.plan;
  const access = getOrganizationAccessState(organization);

  return (
    <>
      <AppHeader title="Plano e assinatura" eyebrow="Acesso e cobranca" />
      <main className="grid gap-6 p-5 pb-28 lg:grid-cols-[1fr_380px] lg:p-8">
        <section className="space-y-6">
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
                Canal de suporte comercial ainda precisa ser configurado pela plataforma. Nenhum contato ficticio foi publicado.
              </p>
            </CardContent>
          </Card>
        </aside>
      </main>
    </>
  );
}
