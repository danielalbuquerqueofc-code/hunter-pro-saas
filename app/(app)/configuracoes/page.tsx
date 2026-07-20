import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrganizationAction } from "@/features/onboarding/actions";
import { getDashboardData } from "@/features/dashboard/queries";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

type ConfiguracoesPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ConfiguracoesPage({ searchParams }: ConfiguracoesPageProps) {
  const query = await searchParams;
  const user = await requireUser();
  const dashboard = await getDashboardData(user.id);

  if (dashboard.organization && !["OWNER", "ADMIN", "SUPER_ADMIN"].includes(String(dashboard.role))) {
    redirect("/dashboard");
  }

  return (
    <>
      <AppHeader title="Empresa" eyebrow="Multi-tenant" />
      <section className="p-8">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>
              {dashboard.organization ? "Dados da empresa" : "Cadastrar empresa"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.organization ? (
              <div className="grid gap-4 text-sm">
                <p>
                  <strong>Nome:</strong> {dashboard.organization.name}
                </p>
                <p>
                  <strong>Slug publico:</strong> /p/{dashboard.organization.slug}
                </p>
                <p>
                  <strong>Seu papel:</strong> {dashboard.role}
                </p>
              </div>
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
      </section>
    </>
  );
}
