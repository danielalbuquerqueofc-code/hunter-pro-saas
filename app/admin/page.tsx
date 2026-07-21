import Link from "next/link";
import { Building2, ClipboardList, LockKeyhole, MessageSquareWarning, Settings, ShieldCheck, Users } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { updateOrganizationAccessAction } from "@/features/admin/actions";
import { getPlatformOrganizations } from "@/features/admin/queries";
import { requireSuperAdmin } from "@/lib/auth";

type AdminPageProps = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === "active") return "bg-emerald-50 text-emerald-700";
  if (status === "trial") return "bg-sky-50 text-sky-700";
  if (status === "trial_expired") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((value ?? 0) / 100);
}

const adminModules = [
  { label: "Visao geral", icon: ShieldCheck, status: "Ativo" },
  { label: "Empresas", icon: Building2, status: "Ativo" },
  { label: "Usuarios", icon: Users, status: "Parcial" },
  { label: "Planos", icon: ClipboardList, status: "Consulta" },
  { label: "Testes gratuitos", icon: ShieldCheck, status: "Ativo" },
  { label: "Assinaturas", icon: ClipboardList, status: "Consulta" },
  { label: "Bloqueios", icon: LockKeyhole, status: "Ativo" },
  { label: "Mensagens do sistema", icon: MessageSquareWarning, status: "Parcial" },
  { label: "Logs e auditoria", icon: ClipboardList, status: "Ativo" },
  { label: "Configuracoes da plataforma", icon: Settings, status: "Pendente" }
];

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await requireSuperAdmin();
  const query = await searchParams;
  const { organizations, recentAuditLogs } = await getPlatformOrganizations({
    q: query.q,
    status: query.status ?? "all"
  });

  const metrics = {
    total: organizations.length,
    active: organizations.filter((item) => item.access.status === "active").length,
    trial: organizations.filter((item) => item.access.status === "trial").length,
    trialEnding: organizations.filter((item) => item.access.status === "trial" && (item.access.daysRemaining ?? 99) <= 3).length,
    expired: organizations.filter((item) => item.access.status === "trial_expired").length,
    blocked: organizations.filter((item) => !item.access.allowed).length,
    overdue: organizations.filter((item) => item.subscription_status === "PAST_DUE" || item.subscription?.status === "PAST_DUE").length,
    users: organizations.reduce((sum, item) => sum + item.memberCount, 0),
    mrr: organizations.reduce((sum, item) => sum + Number(item.plan?.price_cents ?? 0), 0)
  };

  return (
    <>
      <AppHeader title="Administracao da plataforma" eyebrow="Superadministrador" />
      <main className="space-y-6 p-4 pb-24 sm:p-8">
        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {[
            ["Empresas", metrics.total],
            ["Ativas", metrics.active],
            ["Em teste", metrics.trial],
            ["Testes vencendo", metrics.trialEnding],
            ["Bloqueadas", metrics.blocked],
            ["Testes expirados", metrics.expired],
            ["Inadimplentes", metrics.overdue],
            ["Usuarios ativos", metrics.users],
            ["MRR estimado", formatCurrency(metrics.mrr)]
          ].map(([label, value]) => (
            <Card key={label} className="rounded-2xl">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-zinc-500">{label}</p>
                <p className="mt-2 text-3xl font-black text-zinc-950">{value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Modulos do superadministrador</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {adminModules.map((module) => (
              <div key={module.label} className="rounded-2xl border border-zinc-200 bg-white p-4">
                <module.icon className="h-5 w-5 text-brand-orange" />
                <p className="mt-3 font-black">{module.label}</p>
                <p className="mt-1 text-xs font-bold uppercase text-zinc-400">{module.status}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Empresas cadastradas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
              <Input name="q" defaultValue={query.q ?? ""} placeholder="Pesquisar por nome, e-mail, telefone ou slug" />
              <Select name="status" defaultValue={query.status ?? "all"}>
                <option value="all">Todos os status</option>
                <option value="active">Ativas</option>
                <option value="trial">Em teste</option>
                <option value="trial_expired">Teste expirado</option>
                <option value="blocked">Bloqueadas</option>
                <option value="suspended">Suspensas</option>
                <option value="cancelled">Canceladas</option>
              </Select>
              <Button type="submit" variant="secondary">Filtrar</Button>
            </form>

            {organizations.map((organization) => (
              <article
                key={organization.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5"
              >
                <div className="grid gap-4 xl:grid-cols-[1fr_260px] xl:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-black text-zinc-950">{organization.name}</h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(organization.access.status)}`}
                      >
                        {organization.access.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">/{organization.slug} · {organization.email ?? organization.phone ?? organization.whatsapp ?? "sem contato comercial"}</p>
                    <div className="mt-4 grid gap-3 text-sm text-zinc-600 sm:grid-cols-2 xl:grid-cols-4">
                      <span><strong className="block text-zinc-950">Plano</strong>{organization.plan?.name ?? "Sem plano"}</span>
                      <span><strong className="block text-zinc-950">Membros</strong>{organization.memberCount}</span>
                      <span><strong className="block text-zinc-950">Clientes</strong>{organization.contactCount}</span>
                      <span><strong className="block text-zinc-950">Agendamentos</strong>{organization.appointmentCount}</span>
                      <span><strong className="block text-zinc-950">Criada em</strong>{formatDate(organization.created_at)}</span>
                      <span><strong className="block text-zinc-950">Fim do teste</strong>{formatDate(organization.trial_ends_at)}</span>
                      <span><strong className="block text-zinc-950">Vencimento</strong>{formatDate(organization.subscription?.current_period_end)}</span>
                      <span><strong className="block text-zinc-950">Atualizada</strong>{formatDate(organization.updated_at)}</span>
                    </div>
                    {organization.blocked_reason ? (
                      <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
                        {organization.blocked_reason}
                      </p>
                    ) : null}
                    {organization.admin_notes ? (
                      <p className="mt-3 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600">
                        {organization.admin_notes}
                      </p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold text-brand-orange">
                      <Link href={`/p/${organization.slug}`} target="_blank">Ver vitrine</Link>
                    </div>
                  </div>

                  <form action={updateOrganizationAccessAction} className="space-y-3">
                    <input type="hidden" name="organizationId" value={organization.id} />
                    <textarea
                      name="reason"
                      rows={3}
                      placeholder="Motivo da acao administrativa"
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand-orange"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Button name="action" value="activate" size="sm" type="submit">Ativar</Button>
                      <Button name="action" value="extend_trial" size="sm" type="submit" variant="secondary">+5 dias</Button>
                      <Button name="action" value="block" size="sm" type="submit" variant="outline">Bloquear</Button>
                      <Button name="action" value="unblock" size="sm" type="submit" variant="outline">Liberar</Button>
                      <Button name="action" value="expire_trial" size="sm" type="submit" variant="secondary">Encerrar teste</Button>
                      <Button name="action" value="cancel" size="sm" type="submit" variant="outline">Cancelar</Button>
                    </div>
                  </form>
                </div>
              </article>
            ))}
            {organizations.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">Nenhuma empresa encontrada com os filtros atuais.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Logs e auditoria recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAuditLogs.map((log) => (
                <div key={log.id} className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-700">
                  <strong className="text-zinc-950">{log.action}</strong>
                  <span className="ml-2 text-zinc-500">{formatDate(log.created_at)}</span>
                </div>
              ))}
              {recentAuditLogs.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhuma acao administrativa registrada ainda.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
