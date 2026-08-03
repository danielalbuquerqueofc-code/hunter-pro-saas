import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminMetricCard, AdminPageHeader, AdminSection } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  assignOrganizationPlanAction,
  createLimitOverrideAction,
  createManualPaymentAction,
  startImpersonationAction,
  transferOrganizationOwnerAction,
  updateAdminMemberAction,
  updateOrganizationAccessAction
} from "@/features/admin/actions";
import { getAdminOrganizationDetail } from "@/features/admin/queries";

type AdminCompanyDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function formatCurrency(value: number | null | undefined, alreadyDecimal = false) {
  const amount = alreadyDecimal ? Number(value ?? 0) : Number(value ?? 0) / 100;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
}

const roles = ["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT", "PROFESSIONAL", "FINANCIAL"];

export default async function AdminCompanyDetailPage({ params }: AdminCompanyDetailPageProps) {
  const { id } = await params;
  const detail = await getAdminOrganizationDetail(id);
  if (!detail) notFound();

  const { organization, members, subscriptions, plans, counts, limitOverrides, payments, integrations, auditLogs, showcase } = detail;
  const owner = Array.isArray(organization.owner) ? organization.owner[0] : organization.owner;
  const activeSubscription = subscriptions[0] ?? null;

  return (
    <>
      <AdminPageHeader
        eyebrow="Empresa"
        title={organization.name}
        description={`/${organization.slug} - ${organization.access.label}`}
        action={<Button asChild variant="secondary"><Link href="/admin/empresas">Voltar</Link></Button>}
      />

      <main className="space-y-6 p-5 pb-24 lg:p-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard label="Usuarios" value={counts.users} />
          <AdminMetricCard label="Profissionais" value={counts.professionals} />
          <AdminMetricCard label="Servicos" value={counts.services} />
          <AdminMetricCard label="Clientes" value={counts.clients} />
          <AdminMetricCard label="Agendamentos" value={counts.appointments} />
          <AdminMetricCard label="Transacoes" value={counts.transactions} />
          <AdminMetricCard label="Notificacoes" value={counts.notifications} />
          <AdminMetricCard label="Integracoes" value={counts.integrations} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <AdminSection title="Visao geral">
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <p><strong className="block text-zinc-950">Proprietario</strong>{owner?.full_name ?? "Sem proprietario"}</p>
              <p><strong className="block text-zinc-950">Contato</strong>{organization.email ?? organization.phone ?? organization.whatsapp ?? "-"}</p>
              <p><strong className="block text-zinc-950">Documento</strong>{organization.document ?? "-"}</p>
              <p><strong className="block text-zinc-950">Status de acesso</strong>{organization.access.status}</p>
              <p><strong className="block text-zinc-950">Plano</strong>{organization.plan?.name ?? "Sem plano"}</p>
              <p><strong className="block text-zinc-950">Assinatura</strong>{organization.subscription?.status ?? organization.subscription_status ?? "-"}</p>
              <p><strong className="block text-zinc-950">Inicio do trial</strong>{formatDate(organization.trial_started_at)}</p>
              <p><strong className="block text-zinc-950">Fim do trial</strong>{formatDate(organization.trial_ends_at)}</p>
              <p><strong className="block text-zinc-950">Vencimento</strong>{formatDate(activeSubscription?.current_period_end)}</p>
              <p><strong className="block text-zinc-950">Criada em</strong>{formatDate(organization.created_at)}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild variant="secondary"><Link href={`/p/${organization.slug}`} target="_blank">Abrir vitrine</Link></Button>
              <Button asChild variant="secondary"><Link href={`/admin/atividades?organization=${organization.id}`}>Ver logs</Link></Button>
            </div>
          </AdminSection>

          <AdminSection title="Acesso da empresa">
            <form action={updateOrganizationAccessAction} className="space-y-3">
              <input type="hidden" name="organizationId" value={organization.id} />
              <textarea
                name="reason"
                required
                rows={3}
                placeholder="Motivo obrigatorio da acao"
                className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <Button name="action" value="activate" type="submit">Ativar</Button>
                <Button name="action" value="suspend" type="submit" variant="secondary">Suspender</Button>
                <Button name="action" value="block" type="submit" variant="outline">Bloquear</Button>
                <Button name="action" value="unblock" type="submit" variant="outline">Desbloquear</Button>
                <Button name="action" value="extend_trial" type="submit" variant="secondary">Prorrogar trial</Button>
                <Button name="action" value="expire_trial" type="submit" variant="secondary">Encerrar trial</Button>
                <Button name="action" value="cancel" type="submit" variant="outline">Cancelar</Button>
                <Button name="action" value="reactivate" type="submit">Reativar</Button>
              </div>
            </form>
          </AdminSection>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <AdminSection title="Plano e assinatura">
            <form action={assignOrganizationPlanAction} className="grid gap-3 lg:grid-cols-2">
              <input type="hidden" name="organizationId" value={organization.id} />
              <Select name="planCode" defaultValue={organization.plan?.code ?? "start"}>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.code}>
                    {plan.name} - {formatCurrency(plan.monthly_price ?? plan.price_cents, Boolean(plan.monthly_price))}
                  </option>
                ))}
              </Select>
              <Select name="changeTiming" defaultValue="immediate">
                <option value="immediate">Aplicar agora</option>
                <option value="next_cycle">Proximo ciclo</option>
              </Select>
              <Input name="customMonthlyPrice" placeholder="Valor customizado" />
              <Input name="discountPercent" placeholder="Desconto %" />
              <Input name="trialEndsAt" type="date" title="Fim do trial" />
              <Input name="currentPeriodEnd" type="date" title="Proximo vencimento" />
              <Input name="courtesyUntil" type="date" title="Cortesia ate" />
              <Input name="reason" required placeholder="Motivo da alteracao" />
              <Button type="submit" className="lg:col-span-2">Aplicar alteracao</Button>
            </form>
          </AdminSection>

          <AdminSection title="Excecao de limite">
            <form action={createLimitOverrideAction} className="space-y-3">
              <input type="hidden" name="organizationId" value={organization.id} />
              <Select name="limitKey" defaultValue="users">
                <option value="users">Usuarios</option>
                <option value="professionals">Profissionais</option>
                <option value="services">Servicos</option>
                <option value="appointments">Agendamentos</option>
                <option value="storage_mb">Armazenamento MB</option>
              </Select>
              <Input name="limitValue" type="number" min="0" placeholder="Novo limite" required />
              <Input name="expiresAt" type="date" />
              <Input name="reason" placeholder="Motivo obrigatorio" required />
              <Button type="submit" className="w-full">Aplicar excecao</Button>
            </form>
            <div className="mt-4 space-y-2">
              {limitOverrides.map((override) => (
                <p key={override.id} className="rounded-2xl bg-zinc-50 p-3 text-sm">
                  <strong>{override.limit_key}</strong>: {override.limit_value} ate {formatDate(override.expires_at)}
                </p>
              ))}
            </div>
          </AdminSection>
        </section>

        <AdminSection title="Usuarios da empresa">
          <div className="grid gap-4">
            {members.map((member) => {
              const profile = Array.isArray(member.profile) ? member.profile[0] : member.profile;
              return (
                <article key={member.id} className="grid gap-4 rounded-2xl border border-zinc-200 p-4 xl:grid-cols-[1fr_520px] xl:items-end">
                  <div>
                    <h3 className="font-black">{profile?.full_name ?? member.user_id}</h3>
                    <p className="text-sm text-zinc-500">{profile?.phone ?? "-"}</p>
                    <p className="text-xs font-bold uppercase text-zinc-400">Aceite: {formatDate(member.accepted_at)} - Convite: {formatDate(member.invitation_expires_at)}</p>
                  </div>
                  <form action={updateAdminMemberAction} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                    <input type="hidden" name="organizationId" value={organization.id} />
                    <input type="hidden" name="memberId" value={member.id} />
                    <Select name="role" defaultValue={member.role}>
                      {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                    </Select>
                    <Select name="status" defaultValue={member.status}>
                      <option value="PENDING">PENDING</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="REMOVED">REMOVED</option>
                    </Select>
                    <Input name="reason" placeholder="Motivo" required />
                    <Button type="submit" variant="secondary">Salvar</Button>
                  </form>
                </article>
              );
            })}
          </div>
          <form action={transferOrganizationOwnerAction} className="mt-5 grid gap-3 rounded-2xl bg-zinc-50 p-4 lg:grid-cols-[1fr_1fr_auto]">
            <input type="hidden" name="organizationId" value={organization.id} />
            <Select name="newOwnerMemberId" required>
              <option value="">Novo OWNER</option>
              {members.filter((member) => member.status === "ACTIVE").map((member) => {
                const profile = Array.isArray(member.profile) ? member.profile[0] : member.profile;
                return <option key={member.id} value={member.id}>{profile?.full_name ?? member.user_id}</option>;
              })}
            </Select>
            <Input name="reason" required placeholder="Motivo da transferencia" />
            <Button type="submit">Transferir propriedade</Button>
          </form>
        </AdminSection>

        <section className="grid gap-6 xl:grid-cols-2">
          <AdminSection title="Pagamentos manuais">
            <form action={createManualPaymentAction} className="grid gap-3">
              <input type="hidden" name="organizationId" value={organization.id} />
              <Select name="subscriptionId" defaultValue={activeSubscription?.id ?? ""}>
                <option value="">Sem assinatura vinculada</option>
                {subscriptions.map((subscription) => (
                  <option key={subscription.id} value={subscription.id}>{subscription.status} - {formatDate(subscription.current_period_end)}</option>
                ))}
              </Select>
              <Input name="amount" placeholder="Valor" required />
              <Select name="status" defaultValue="paid">
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
                <option value="overdue">Vencido</option>
                <option value="cancelled">Cancelado</option>
                <option value="refunded">Reembolsado</option>
              </Select>
              <Input name="dueDate" type="date" />
              <Input name="paymentMethod" placeholder="Forma de pagamento" />
              <Input name="reason" placeholder="Motivo obrigatorio" required />
              <Button type="submit">Registrar pagamento</Button>
            </form>
            <div className="mt-4 space-y-2">
              {payments.map((payment) => (
                <p key={payment.id} className="rounded-2xl bg-zinc-50 p-3 text-sm">
                  {formatCurrency(payment.amount_cents)} - {payment.status} - {formatDate(payment.created_at)}
                </p>
              ))}
            </div>
          </AdminSection>

          <AdminSection title="Seguranca e suporte">
            <form action={startImpersonationAction} className="space-y-3">
              <input type="hidden" name="organizationId" value={organization.id} />
              <Input name="reason" required placeholder="Motivo para visualizar como empresa" />
              <Button type="submit" className="w-full" variant="secondary">Visualizar como empresa</Button>
            </form>
            <p className="mt-3 text-sm font-semibold text-zinc-500">
              Esta acao cria uma sessao auditavel e temporaria, abre o dashboard da empresa e mostra um aviso de modo suporte ativo.
            </p>
          </AdminSection>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <AdminSection title="Vitrine">
            {showcase ? (
              <div className="space-y-2 text-sm">
                <p><strong>Titulo:</strong> {showcase.title}</p>
                <p><strong>Status:</strong> {showcase.status}</p>
                <p><strong>Atualizada:</strong> {formatDate(showcase.updated_at)}</p>
                <Button asChild variant="secondary"><Link href={`/p/${organization.slug}`} target="_blank">Abrir vitrine publica</Link></Button>
              </div>
            ) : <p className="text-sm text-zinc-500">Esta empresa ainda nao possui vitrine configurada.</p>}
          </AdminSection>

          <AdminSection title="Integracoes">
            <div className="space-y-2">
              {integrations.map((integration) => (
                <p key={integration.id} className="rounded-2xl bg-zinc-50 p-3 text-sm">
                  <strong>{integration.provider}</strong> - {integration.status} - {integration.display_name}
                </p>
              ))}
              {integrations.length === 0 ? <p className="text-sm text-zinc-500">Nenhuma integracao cadastrada.</p> : null}
            </div>
          </AdminSection>
        </section>

        <AdminSection title="Atividades recentes">
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <p key={log.id} className="rounded-2xl bg-zinc-50 p-3 text-sm">
                <strong>{log.action}</strong> - {formatDate(log.created_at)}
              </p>
            ))}
            {auditLogs.length === 0 ? <p className="text-sm text-zinc-500">Nenhuma atividade registrada.</p> : null}
          </div>
        </AdminSection>
      </main>
    </>
  );
}
