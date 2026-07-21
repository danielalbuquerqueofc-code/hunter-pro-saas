import { KeyRound, ShieldCheck, UserCircle } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMyPasswordAction, updateMyProfileAction } from "@/features/account/actions";
import { requireOrganizationAccess } from "@/features/organizations/guards";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type MinhaContaPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function MinhaContaPage({ searchParams }: MinhaContaPageProps) {
  const query = await searchParams;
  const user = await requireUser();
  await requireOrganizationAccess();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,avatar_url,phone,is_super_admin,created_at,updated_at")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <AppHeader title="Minha conta" eyebrow="Perfil e seguranca" />
      <main className="grid gap-6 p-5 pb-28 lg:grid-cols-[1fr_360px] lg:p-8">
        <section className="space-y-6">
          {query.error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {query.error}
            </div>
          ) : null}
          {query.success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              Alteracao salva com sucesso.
            </div>
          ) : null}

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-brand-orange" />
                Dados pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateMyProfileAction} className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome completo</Label>
                    <Input id="fullName" name="fullName" defaultValue={profile?.full_name ?? ""} autoComplete="name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone / WhatsApp</Label>
                    <Input id="phone" name="phone" defaultValue={profile?.phone ?? ""} inputMode="tel" autoComplete="tel" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail de acesso</Label>
                  <Input id="email" value={user.email ?? ""} disabled />
                  <p className="text-xs text-zinc-500">Alteracao de e-mail deve passar por confirmacao do provedor de autenticacao.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">Foto do perfil</Label>
                  <Input id="avatarUrl" name="avatarUrl" defaultValue={profile?.avatar_url ?? ""} placeholder="https://..." />
                  <p className="text-xs text-zinc-500">Nesta versao, a foto usa URL segura. Upload com recorte fica como proxima etapa de Storage.</p>
                </div>
                <Button type="submit" className="w-full sm:w-fit">Salvar perfil</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-brand-orange" />
                Senha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateMyPasswordAction} className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">Nova senha</Label>
                    <Input id="password" name="password" type="password" minLength={8} autoComplete="new-password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                    <Input id="confirmPassword" name="confirmPassword" type="password" minLength={8} autoComplete="new-password" />
                  </div>
                </div>
                <Button type="submit" variant="secondary" className="w-full sm:w-fit">Alterar senha</Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-4">
          <Card className="rounded-3xl">
            <CardContent className="p-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-lg font-black">Seguranca da conta</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Perfil e senha sao alterados pelo usuario autenticado. Permissoes, cargos e acesso a empresas ficam restritos aos administradores autorizados.
              </p>
              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="font-bold text-zinc-950">Criada em</dt>
                  <dd className="text-zinc-500">{profile?.created_at ? new Date(profile.created_at).toLocaleString("pt-BR") : "-"}</dd>
                </div>
                <div>
                  <dt className="font-bold text-zinc-950">Ultima atualizacao</dt>
                  <dd className="text-zinc-500">{profile?.updated_at ? new Date(profile.updated_at).toLocaleString("pt-BR") : "-"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </main>
    </>
  );
}
