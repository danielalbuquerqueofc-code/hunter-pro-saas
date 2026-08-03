import Link from "next/link";
import { AdminPageHeader, AdminSection } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { getAdminSubscriptionsAndPayments } from "@/features/admin/queries";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value ?? 0) / 100);
}

export default async function AdminPaymentsPage() {
  const { payments, billingEvents } = await getAdminSubscriptionsAndPayments();
  return (
    <>
      <AdminPageHeader eyebrow="Pagamentos" title="Pagamentos e webhooks" description="Registros manuais, eventos de cobrança e tentativas dos gateways." />
      <main className="space-y-6 p-5 pb-24 lg:p-8">
        <AdminSection title="Pagamentos registrados">
          <div className="grid gap-3">
            {payments.map((payment) => {
              const organization = Array.isArray(payment.organization) ? payment.organization[0] : payment.organization;
              return (
                <article key={payment.id} className="grid gap-3 rounded-2xl border border-zinc-200 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <h2 className="font-black">{organization?.name ?? "Empresa"}</h2>
                    <p className="text-sm text-zinc-500">{formatCurrency(payment.amount_cents)} - {payment.status} - {payment.provider}</p>
                    <p className="text-sm text-zinc-500">Vencimento: {payment.due_date ?? "-"} - Pago em: {formatDate(payment.paid_at)}</p>
                  </div>
                  {organization?.id ? <Button asChild variant="secondary"><Link href={`/admin/empresas/${organization.id}`}>Abrir</Link></Button> : null}
                </article>
              );
            })}
            {payments.length === 0 ? <p className="text-sm text-zinc-500">Nenhum pagamento manual registrado.</p> : null}
          </div>
        </AdminSection>

        <AdminSection title="Eventos de cobrança">
          <div className="grid gap-3">
            {billingEvents.map((event) => {
              const organization = Array.isArray(event.organization) ? event.organization[0] : event.organization;
              return (
                <article key={event.id} className="rounded-2xl border border-zinc-200 p-4">
                  <strong>{event.event_type}</strong>
                  <p className="text-sm text-zinc-500">{organization?.name ?? "Sem empresa"} - {event.provider} - {event.status} - {formatDate(event.created_at)}</p>
                </article>
              );
            })}
            {billingEvents.length === 0 ? <p className="text-sm text-zinc-500">Nenhum webhook registrado.</p> : null}
          </div>
        </AdminSection>
      </main>
    </>
  );
}
