import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getPlatformOrganizations } from "@/features/admin/queries";

type AdminCompaniesPageProps = {
  searchParams: Promise<{ q?: string; status?: string; plan?: string; page?: string }>;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === "active") return "bg-emerald-50 text-emerald-700";
  if (status === "trial") return "bg-sky-50 text-sky-700";
  if (status === "trial_expired") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

function ownerName(owner: unknown) {
  const row = owner as { full_name?: string | null; phone?: string | null } | null;
  return row?.full_name ?? "Sem proprietario";
}

export default async function AdminCompaniesPage({ searchParams }: AdminCompaniesPageProps) {
  const query = await searchParams;
  const { organizations, plans, pagination } = await getPlatformOrganizations(query);

  return (
    <>
      <AdminPageHeader
        eyebrow="Empresas"
        title="Clientes Hunter Pro"
        description="Pesquise, filtre e abra a central operacional de cada empresa."
        action={<Button asChild><Link href="/cadastro">Nova empresa</Link></Button>}
      />

      <main className="space-y-5 p-5 pb-24 lg:p-8">
        <form className="grid gap-3 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_220px_220px_auto]">
          <Input name="q" defaultValue={query.q ?? ""} placeholder="Nome, proprietario, e-mail, telefone, slug, ID ou documento" />
          <Select name="status" defaultValue={query.status ?? "all"}>
            <option value="all">Todos os status</option>
            <option value="active">Ativas</option>
            <option value="trial">Trial</option>
            <option value="trial_expired">Trial expirado</option>
            <option value="blocked">Bloqueadas</option>
            <option value="suspended">Suspensas</option>
            <option value="cancelled">Canceladas</option>
          </Select>
          <Select name="plan" defaultValue={query.plan ?? "all"}>
            <option value="all">Todos os planos</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.code}>{plan.name}</option>
            ))}
          </Select>
          <Button type="submit">Filtrar</Button>
        </form>

        <section className="hidden overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm xl:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="p-4">Empresa</th>
                <th className="p-4">Proprietario</th>
                <th className="p-4">Plano</th>
                <th className="p-4">Status</th>
                <th className="p-4">Uso</th>
                <th className="p-4">Vencimento</th>
                <th className="p-4">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((organization) => (
                <tr key={organization.id} className="border-t border-zinc-100">
                  <td className="p-4">
                    <strong className="block text-zinc-950">{organization.name}</strong>
                    <span className="text-zinc-500">/{organization.slug}</span>
                  </td>
                  <td className="p-4">
                    <strong className="block text-zinc-800">{ownerName(organization.owner)}</strong>
                    <span className="text-zinc-500">{organization.email ?? organization.phone ?? organization.whatsapp ?? "-"}</span>
                  </td>
                  <td className="p-4">{organization.plan?.name ?? "Sem plano"}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(organization.access.status)}`}>
                      {organization.access.label}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="block">Usuarios: {organization.memberCount}</span>
                    <span className="block">Profissionais: {organization.professionalCount}</span>
                  </td>
                  <td className="p-4">{formatDate(organization.subscription?.current_period_end)}</td>
                  <td className="p-4">
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/admin/empresas/${organization.id}`}>Abrir</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="grid gap-4 xl:hidden">
          {organizations.map((organization) => (
            <article key={organization.id} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">{organization.name}</h2>
                  <p className="text-sm font-semibold text-zinc-500">/{organization.slug}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(organization.access.status)}`}>
                  {organization.access.label}
                </span>
              </div>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <p><strong className="block">Proprietario</strong>{ownerName(organization.owner)}</p>
                <p><strong className="block">Plano</strong>{organization.plan?.name ?? "Sem plano"}</p>
                <p><strong className="block">Usuarios</strong>{organization.memberCount}</p>
                <p><strong className="block">Profissionais</strong>{organization.professionalCount}</p>
                <p><strong className="block">Criada em</strong>{formatDate(organization.created_at)}</p>
                <p><strong className="block">Vencimento</strong>{formatDate(organization.subscription?.current_period_end)}</p>
              </div>
              <Button asChild className="mt-4 w-full">
                <Link href={`/admin/empresas/${organization.id}`}>Abrir empresa</Link>
              </Button>
            </article>
          ))}
        </section>

        {organizations.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-zinc-200 bg-white p-10 text-center text-sm font-semibold text-zinc-500">
            Nenhuma empresa encontrada com os filtros atuais.
          </p>
        ) : null}

        <div className="flex items-center justify-between rounded-3xl border border-zinc-200 bg-white p-4">
          <Button asChild variant="secondary" aria-disabled={!pagination.hasPreviousPage}>
            <Link href={`/admin/empresas?page=${Math.max(pagination.page - 1, 1)}`}>Anterior</Link>
          </Button>
          <span className="text-sm font-bold text-zinc-500">Pagina {pagination.page}</span>
          <Button asChild variant="secondary" aria-disabled={!pagination.hasNextPage}>
            <Link href={`/admin/empresas?page=${pagination.page + 1}`}>Proxima</Link>
          </Button>
        </div>
      </main>
    </>
  );
}
