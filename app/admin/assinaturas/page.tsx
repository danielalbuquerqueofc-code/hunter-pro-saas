import Link from "next/link";
import { AdminPageHeader, AdminSection } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { getAdminSubscriptionsAndPayments } from "@/features/admin/queries";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

export default async function AdminSubscriptionsPage() {
  const { subscriptions } = await getAdminSubscriptionsAndPayments();
  return (
    <>
      <AdminPageHeader eyebrow="Assinaturas" title="Assinaturas da plataforma" description="Acompanhe plano, gateway, status e vencimentos." />
      <main className="p-5 pb-24 lg:p-8">
        <AdminSection title="Assinaturas">
          <div className="grid gap-3">
            {subscriptions.map((subscription) => {
              const organization = Array.isArray(subscription.organization) ? subscription.organization[0] : subscription.organization;
              const plan = Array.isArray(subscription.plan) ? subscription.plan[0] : subscription.plan;
              return (
                <article key={subscription.id} className="grid gap-3 rounded-2xl border border-zinc-200 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <h2 className="font-black">{organization?.name ?? "Empresa"}</h2>
                    <p className="text-sm text-zinc-500">{plan?.name ?? "Sem plano"} - {subscription.billing_provider ?? "Sem gateway"} - {subscription.status}</p>
                    <p className="text-sm text-zinc-500">Vencimento: {formatDate(subscription.current_period_end)} - Asaas: {subscription.asaas_status ?? "-"}</p>
                  </div>
                  {organization?.id ? <Button asChild variant="secondary"><Link href={`/admin/empresas/${organization.id}`}>Abrir</Link></Button> : null}
                </article>
              );
            })}
            {subscriptions.length === 0 ? <p className="text-sm text-zinc-500">Nenhuma assinatura encontrada.</p> : null}
          </div>
        </AdminSection>
      </main>
    </>
  );
}
