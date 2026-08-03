import { Users } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatPlanPrice, getOrganizationPlanUsage } from "@/features/billing/plan-limits";
import { requireOrganizationAccess } from "@/features/organizations/guards";
import { inviteOrganizationUserAction, updateOrganizationMemberAction } from "@/features/users/actions";
import { ROLES } from "@/lib/constants/roles";
import { createAdminClient } from "@/lib/supabase/admin";

type UsuariosPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

const COMPANY_ROLES = ROLES.filter((role) => role !== "SUPER_ADMIN");
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  ACTIVE: "Ativo",
  SUSPENDED: "Desativado",
  REMOVED: "Removido"
};

export default async function UsuariosPage({ searchParams }: UsuariosPageProps) {
  const query = await searchParams;
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN"]);
  const admin = createAdminClient();
  const planUsage = await getOrganizationPlanUsage(admin, organization.id);

  const { data: members } = await admin
    .from("organization_members")
    .select("id,user_id,role,status,created_at,profile:profiles(full_name,phone,avatar_url)")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: true });
  const { data: invitations } = await admin
    .from("organization_invitations")
    .select("id,email,role,status,provider_error,created_at")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <>
      <AppHeader title="Usuarios e equipe" eyebrow="Permissoes da empresa" />
      <main className="space-y-6 p-5 pb-28 lg:p-8">
        {query.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {query.error}
          </div>
        ) : null}
        {query.success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            Membro atualizado com sucesso.
          </div>
        ) : null}

        <Card className="rounded-3xl">
          <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-zinc-400">Plano atual</p>
              <h2 className="mt-1 text-2xl font-black text-zinc-950">
                {planUsage.plan.name} - {formatPlanPrice(planUsage.plan)}/mes
              </h2>
              <p className="mt-2 text-sm font-semibold text-zinc-500">
                {planUsage.usedSlots} de {planUsage.maximumUsers} vaga{planUsage.maximumUsers === 1 ? "" : "s"} em uso.
                {planUsage.pendingInvitations > 0 ? ` ${planUsage.pendingInvitations} convite pendente reserva vaga.` : ""}
              </p>
            </div>
            <div className="rounded-2xl bg-zinc-50 p-4 text-center">
              <p className="text-3xl font-black text-brand-orange">{planUsage.availableSlots}</p>
              <p className="text-xs font-black uppercase text-zinc-400">Disponiveis</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Convidar novo usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={inviteOrganizationUserAction} className="grid gap-4 lg:grid-cols-[1fr_240px_auto] lg:items-end">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">E-mail</Label>
                <Input id="inviteEmail" name="email" type="email" placeholder="usuario@empresa.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviteRole">Perfil</Label>
                <Select id="inviteRole" name="role" defaultValue="ATTENDANT">
                  {COMPANY_ROLES.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </Select>
              </div>
              <Button type="submit">Enviar convite</Button>
            </form>
            <p className="mt-3 text-xs text-zinc-500">
              O convite e enviado pelo Supabase Auth. O acesso fica vinculado apenas a esta empresa.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-orange" />
              Membros da empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {(members ?? []).map((member) => {
              const profile = Array.isArray(member.profile) ? member.profile[0] : member.profile;
              return (
                <article key={member.id} className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-4 lg:grid-cols-[1fr_360px] lg:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 font-black text-emerald-700">
                      {(profile?.full_name ?? "U").slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate font-black text-zinc-950">{profile?.full_name ?? "Usuario sem nome"}</h2>
                      <p className="truncate text-sm text-zinc-500">{profile?.phone ?? member.user_id}</p>
                      <p className="mt-1 text-xs font-bold uppercase text-zinc-400">{STATUS_LABEL[member.status] ?? member.status}</p>
                    </div>
                  </div>
                  <form action={updateOrganizationMemberAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <input type="hidden" name="memberId" value={member.id} />
                    <div className="space-y-2">
                      <Label htmlFor={`role-${member.id}`}>Perfil</Label>
                      <Select id={`role-${member.id}`} name="role" defaultValue={member.role}>
                        {COMPANY_ROLES.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`status-${member.id}`}>Status</Label>
                      <Select id={`status-${member.id}`} name="status" defaultValue={member.status}>
                        <option value="ACTIVE">Ativo</option>
                        <option value="PENDING">Pendente</option>
                        <option value="SUSPENDED">Desativado</option>
                        <option value="REMOVED">Removido</option>
                      </Select>
                    </div>
                    <Button type="submit" variant="secondary">Salvar</Button>
                  </form>
                </article>
              );
            })}
            {(members ?? []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">
                Nenhum membro encontrado para esta empresa.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Historico de convites</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {(invitations ?? []).map((invite) => (
              <article key={invite.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-zinc-950">{invite.email}</p>
                    <p className="text-sm text-zinc-500">{invite.role} - {new Date(invite.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-600">{invite.status}</span>
                </div>
                {invite.provider_error ? (
                  <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{invite.provider_error}</p>
                ) : null}
              </article>
            ))}
            {(invitations ?? []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">
                Nenhum convite enviado ainda.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
