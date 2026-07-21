import { AppHeader } from "@/components/layout/app-header";
import { StorageImageUpload } from "@/components/forms/storage-image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOrganizationAction } from "@/features/onboarding/actions";
import { getDashboardData } from "@/features/dashboard/queries";
import { updateOrganizationProfileAction } from "@/features/settings/actions";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type ConfiguracoesPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function ConfiguracoesPage({ searchParams }: ConfiguracoesPageProps) {
  const query = await searchParams;
  const user = await requireUser();
  const supabase = await createClient();
  const dashboard = await getDashboardData(user.id);
  const { data: organizationDetails } = dashboard.organization
    ? await supabase
        .from("organizations")
        .select("id,name,slug,legal_name,document,state_registration,municipal_registration,phone,whatsapp,email,description,logo_url,cover_url,address,city,state,zip_code,billing_email,billing_phone,billing_address,billing_city,billing_state,billing_zip_code,trial_started_at,trial_ends_at,access_status,subscription_status")
        .eq("id", dashboard.organization.id)
        .maybeSingle()
    : { data: null };

  if (dashboard.organization && !["OWNER", "ADMIN", "SUPER_ADMIN"].includes(String(dashboard.role))) {
    redirect("/dashboard");
  }

  return (
    <>
      <AppHeader title="Empresa" eyebrow="Multi-tenant" />
      <section className="grid gap-6 p-5 pb-28 lg:grid-cols-[1fr_360px] lg:p-8">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>
              {dashboard.organization ? "Dados da empresa" : "Cadastrar empresa"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {query.error ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {query.error}
              </div>
            ) : null}
            {query.success ? (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                Dados atualizados com sucesso.
              </div>
            ) : null}
            {dashboard.organization ? (
              <form action={updateOrganizationProfileAction} className="grid gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome comercial</Label>
                    <Input id="name" name="name" defaultValue={organizationDetails?.name ?? dashboard.organization.name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug publico</Label>
                    <Input id="slug" value={`/p/${dashboard.organization.slug}`} disabled />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="legalName">Razao social</Label>
                    <Input id="legalName" name="legalName" defaultValue={organizationDetails?.legal_name ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document">Documento / CNPJ</Label>
                    <Input id="document" name="document" defaultValue={organizationDetails?.document ?? ""} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stateRegistration">Inscricao estadual</Label>
                    <Input id="stateRegistration" name="stateRegistration" defaultValue={organizationDetails?.state_registration ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="municipalRegistration">Inscricao municipal</Label>
                    <Input id="municipalRegistration" name="municipalRegistration" defaultValue={organizationDetails?.municipal_registration ?? ""} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" name="phone" defaultValue={organizationDetails?.phone ?? ""} inputMode="tel" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input id="whatsapp" name="whatsapp" defaultValue={organizationDetails?.whatsapp ?? ""} inputMode="tel" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail comercial</Label>
                    <Input id="email" name="email" defaultValue={organizationDetails?.email ?? ""} type="email" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descricao da empresa</Label>
                  <Textarea id="description" name="description" defaultValue={organizationDetails?.description ?? ""} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <StorageImageUpload
                    id="logoUpload"
                    name="logoUrl"
                    label="Logo"
                    initialUrl={organizationDetails?.logo_url}
                    pathPrefix={`${dashboard.organization.id}/organization`}
                    filePrefix="logo"
                  />
                  <StorageImageUpload
                    id="coverUpload"
                    name="coverUrl"
                    label="Capa"
                    initialUrl={organizationDetails?.cover_url}
                    pathPrefix={`${dashboard.organization.id}/organization`}
                    filePrefix="cover"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereco</Label>
                  <Input id="address" name="address" defaultValue={organizationDetails?.address ?? ""} />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" name="city" defaultValue={organizationDetails?.city ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input id="state" name="state" defaultValue={organizationDetails?.state ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input id="zipCode" name="zipCode" defaultValue={organizationDetails?.zip_code ?? ""} />
                  </div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <h3 className="font-black text-zinc-950">Dados de cobranca</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="billingEmail">E-mail de cobranca</Label>
                      <Input id="billingEmail" name="billingEmail" defaultValue={organizationDetails?.billing_email ?? ""} type="email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingPhone">Telefone de cobranca</Label>
                      <Input id="billingPhone" name="billingPhone" defaultValue={organizationDetails?.billing_phone ?? ""} inputMode="tel" />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billingAddress">Endereco de cobranca</Label>
                      <Input id="billingAddress" name="billingAddress" defaultValue={organizationDetails?.billing_address ?? ""} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="billingCity">Cidade</Label>
                        <Input id="billingCity" name="billingCity" defaultValue={organizationDetails?.billing_city ?? ""} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingState">Estado</Label>
                        <Input id="billingState" name="billingState" defaultValue={organizationDetails?.billing_state ?? ""} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingZipCode">CEP</Label>
                        <Input id="billingZipCode" name="billingZipCode" defaultValue={organizationDetails?.billing_zip_code ?? ""} />
                      </div>
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full sm:w-fit">Salvar dados da empresa</Button>
              </form>
            ) : (
              <form action={createOrganizationAction} className="grid gap-4">
                {query.error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                    {query.error}
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da empresa</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug publico</Label>
                  <Input
                    id="slug"
                    name="slug"
                    placeholder="minha-empresa"
                  />
                  <p className="text-xs text-zinc-500">
                    Pode escrever normal. O sistema transforma automaticamente em letras
                    minusculas e hifens.
                  </p>
                </div>
                <Button type="submit">Criar empresa</Button>
              </form>
            )}
          </CardContent>
        </Card>
        {dashboard.organization ? (
          <aside className="space-y-4">
            <Card className="rounded-3xl">
              <CardContent className="p-5">
                <p className="text-xs font-black uppercase text-zinc-500">Acesso</p>
                <h2 className="mt-2 text-xl font-black">{organizationDetails?.access_status ?? "active"}</h2>
                <div className="mt-4 grid gap-3 text-sm text-zinc-600">
                  <p><strong className="text-zinc-950">Papel:</strong> {dashboard.role}</p>
                  <p><strong className="text-zinc-950">Plano:</strong> {dashboard.stats.activePlan}</p>
                  <p><strong className="text-zinc-950">Assinatura:</strong> {organizationDetails?.subscription_status ?? dashboard.stats.status}</p>
                  <p><strong className="text-zinc-950">Fim do teste:</strong> {organizationDetails?.trial_ends_at ? new Date(organizationDetails.trial_ends_at).toLocaleString("pt-BR") : "-"}</p>
                </div>
              </CardContent>
            </Card>
          </aside>
        ) : null}
      </section>
    </>
  );
}
