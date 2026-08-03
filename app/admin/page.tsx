import Link from "next/link";
import { AdminMetricCard, AdminPageHeader, AdminSection } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { getAdminDashboard } from "@/features/admin/queries";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboard();
  const metrics = dashboard.metrics;

  return (
    <>
      <AdminPageHeader
        eyebrow="Superadmin"
        title="Central Administrativa"
        description="Controle as empresas, planos, assinaturas, bloqueios e riscos operacionais do Hunter Pro."
        action={<Button asChild><Link href="/admin/empresas">Gerenciar empresas</Link></Button>}
      />

      <main className="space-y-6 p-5 pb-24 lg:p-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard label="Total de empresas" value={metrics.totalOrganizations} />
          <AdminMetricCard label="Empresas ativas" value={metrics.activeOrganizations} />
          <AdminMetricCard label="Empresas em trial" value={metrics.trialOrganizations} hint={`${metrics.trialEnding} vencendo`} />
          <AdminMetricCard label="MRR estimado" value={formatCurrency(metrics.mrr)} />
          <AdminMetricCard label="Trials expirados" value={metrics.trialExpired} />
          <AdminMetricCard label="Inadimplentes" value={metrics.overdue} />
          <AdminMetricCard label="Suspensas" value={metrics.suspended} />
          <AdminMetricCard label="Canceladas" value={metrics.cancelled} />
          <AdminMetricCard label="Usuarios totais" value={metrics.totalUsers} />
          <AdminMetricCard label="Profissionais" value={metrics.totalProfessionals} />
          <AdminMetricCard label="Agendamentos" value={metrics.totalAppointments} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <AdminSection title="Acoes rapidas">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild variant="secondary"><Link href="/admin/empresas">Localizar empresa</Link></Button>
              <Button asChild variant="secondary"><Link href="/admin/planos">Criar ou editar plano</Link></Button>
              <Button asChild variant="secondary"><Link href="/admin/assinaturas?status=PAST_DUE">Ver inadimplentes</Link></Button>
              <Button asChild variant="secondary"><Link href="/admin/atividades">Visualizar logs</Link></Button>
            </div>
          </AdminSection>

          <AdminSection title="Assinaturas por plano">
            <div className="space-y-3">
              {dashboard.subscriptionsByPlan.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl bg-zinc-50 p-4">
                  <span className="font-bold text-zinc-700">{item.label}</span>
                  <strong className="text-zinc-950">{item.value}</strong>
                </div>
              ))}
              {dashboard.subscriptionsByPlan.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
                  Nenhuma assinatura ativa encontrada.
                </p>
              ) : null}
            </div>
          </AdminSection>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <AdminSection title="Alertas administrativos">
            <div className="space-y-3">
              {metrics.overdue > 0 ? <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{metrics.overdue} empresa(s) com status financeiro vencido.</p> : null}
              {metrics.trialEnding > 0 ? <p className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-700">{metrics.trialEnding} trial(s) perto do vencimento.</p> : null}
              {dashboard.billingEvents.map((event) => (
                <p key={event.id} className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
                  <strong className="text-zinc-950">{event.event_type}</strong> - {event.status}
                </p>
              ))}
              {metrics.overdue === 0 && metrics.trialEnding === 0 && dashboard.billingEvents.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
                  Nenhum alerta critico no momento.
                </p>
              ) : null}
            </div>
          </AdminSection>

          <AdminSection title="Auditoria recente">
            <div className="space-y-3">
              {dashboard.recentAuditLogs.map((log) => (
                <div key={log.id} className="rounded-2xl bg-zinc-50 p-4 text-sm">
                  <strong className="block text-zinc-950">{log.action}</strong>
                  <span className="text-zinc-500">{formatDate(log.created_at)}</span>
                </div>
              ))}
              {dashboard.recentAuditLogs.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
                  Nenhuma atividade registrada ainda.
                </p>
              ) : null}
            </div>
          </AdminSection>
        </section>
      </main>
    </>
  );
}
