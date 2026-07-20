import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateOrganizationAccessAction } from "@/features/admin/actions";
import { getPlatformOrganizations } from "@/features/admin/queries";
import { requireSuperAdmin } from "@/lib/auth";

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

export default async function AdminPage() {
  await requireSuperAdmin();
  const { organizations, recentAuditLogs } = await getPlatformOrganizations();

  return (
    <>
      <AppHeader title="Central do SaaS" eyebrow="Super administrador" />
      <main className="space-y-6 p-4 pb-24 sm:p-8">
        <section className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-zinc-500">Empresas</p>
              <p className="mt-2 text-3xl font-black text-zinc-950">{organizations.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-zinc-500">Ativas</p>
              <p className="mt-2 text-3xl font-black text-zinc-950">
                {organizations.filter((item) => item.access.status === "active").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-zinc-500">Em teste</p>
              <p className="mt-2 text-3xl font-black text-zinc-950">
                {organizations.filter((item) => item.access.status === "trial").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-zinc-500">Bloqueadas</p>
              <p className="mt-2 text-3xl font-black text-zinc-950">
                {organizations.filter((item) => !item.access.allowed).length}
              </p>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Empresas cadastradas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {organizations.map((organization) => (
              <article
                key={organization.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5"
              >
                <div className="grid gap-4 lg:grid-cols-[1fr_220px] lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-black text-zinc-950">{organization.name}</h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(organization.access.status)}`}
                      >
                        {organization.access.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">/{organization.slug}</p>
                    <div className="mt-4 grid gap-3 text-sm text-zinc-600 sm:grid-cols-3">
                      <span>
                        <strong className="block text-zinc-950">Membros</strong>
                        {organization.memberCount}
                      </span>
                      <span>
                        <strong className="block text-zinc-950">Criada em</strong>
                        {formatDate(organization.created_at)}
                      </span>
                      <span>
                        <strong className="block text-zinc-950">Fim do teste</strong>
                        {formatDate(organization.trial_ends_at)}
                      </span>
                    </div>
                    {organization.blocked_reason ? (
                      <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
                        {organization.blocked_reason}
                      </p>
                    ) : null}
                  </div>

                  <form action={updateOrganizationAccessAction} className="space-y-3">
                    <input type="hidden" name="organizationId" value={organization.id} />
                    <textarea
                      name="reason"
                      rows={3}
                      placeholder="Motivo opcional"
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand-orange"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Button name="action" value="activate" size="sm" type="submit">
                        Ativar
                      </Button>
                      <Button name="action" value="extend_trial" size="sm" type="submit" variant="secondary">
                        +5 dias
                      </Button>
                      <Button name="action" value="block" size="sm" type="submit" variant="outline">
                        Bloquear
                      </Button>
                      <Button name="action" value="unblock" size="sm" type="submit" variant="outline">
                        Liberar
                      </Button>
                      <Button name="action" value="expire_trial" size="sm" type="submit" variant="secondary">
                        Encerrar teste
                      </Button>
                      <Button name="action" value="cancel" size="sm" type="submit" variant="outline">
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </div>
              </article>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auditoria recente</CardTitle>
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
