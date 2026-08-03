import Link from "next/link";
import { AdminPageHeader, AdminSection } from "@/components/admin/admin-shell";
import { getAdminUsers } from "@/features/admin/queries";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

export default async function AdminUsersPage() {
  const { profiles, members, invitations } = await getAdminUsers();
  const membershipsByUser = new Map<string, typeof members>();
  for (const member of members) {
    const list = membershipsByUser.get(member.user_id) ?? [];
    list.push(member);
    membershipsByUser.set(member.user_id, list);
  }

  return (
    <>
      <AdminPageHeader eyebrow="Usuarios" title="Usuarios da plataforma" description="Visualize vinculos, perfis e convites pendentes em todas as empresas." />
      <main className="space-y-6 p-5 pb-24 lg:p-8">
        <AdminSection title="Usuarios cadastrados">
          <div className="grid gap-4">
            {profiles.map((profile) => (
              <article key={profile.id} className="rounded-3xl border border-zinc-200 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-lg font-black">{profile.full_name ?? profile.id}</h2>
                    <p className="text-sm text-zinc-500">{profile.phone ?? "Sem telefone"} - criado em {formatDate(profile.created_at)}</p>
                    {profile.is_super_admin ? <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">SUPER_ADMIN</span> : null}
                  </div>
                  <div className="grid gap-2 lg:min-w-96">
                    {(membershipsByUser.get(profile.id) ?? []).map((member) => {
                      const organization = Array.isArray(member.organization) ? member.organization[0] : member.organization;
                      return (
                        <Link key={member.id} href={`/admin/empresas/${organization?.id}`} className="rounded-2xl bg-zinc-50 p-3 text-sm">
                          <strong>{organization?.name ?? "Empresa"}</strong> - {member.role} - {member.status}
                        </Link>
                      );
                    })}
                    {(membershipsByUser.get(profile.id) ?? []).length === 0 ? (
                      <p className="rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-500">Sem empresas vinculadas.</p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </AdminSection>

        <AdminSection title="Convites pendentes e historico">
          <div className="grid gap-3">
            {invitations.map((invite) => {
              const organization = Array.isArray(invite.organization) ? invite.organization[0] : invite.organization;
              return (
                <article key={invite.id} className="rounded-2xl border border-zinc-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <strong>{invite.email}</strong>
                      <p className="text-sm text-zinc-500">{organization?.name ?? "Empresa"} - {invite.role} - {formatDate(invite.created_at)}</p>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black">{invite.status}</span>
                  </div>
                </article>
              );
            })}
            {invitations.length === 0 ? <p className="text-sm text-zinc-500">Nenhum convite registrado.</p> : null}
          </div>
        </AdminSection>
      </main>
    </>
  );
}
