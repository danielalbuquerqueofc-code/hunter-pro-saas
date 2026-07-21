import { Users } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { requireOrganizationAccess } from "@/features/organizations/guards";
import { updateOrganizationMemberAction } from "@/features/users/actions";
import { ROLES } from "@/lib/constants/roles";
import { createClient } from "@/lib/supabase/server";

type UsuariosPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

const COMPANY_ROLES = ROLES.filter((role) => role !== "SUPER_ADMIN");
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativo",
  INVITED: "Convidado",
  DISABLED: "Desativado"
};

export default async function UsuariosPage({ searchParams }: UsuariosPageProps) {
  const query = await searchParams;
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN"]);
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("organization_members")
    .select("id,user_id,role,status,created_at,profile:profiles(full_name,phone,avatar_url)")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: true });

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
                        <option value="INVITED">Convidado</option>
                        <option value="DISABLED">Desativado</option>
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
      </main>
    </>
  );
}
