import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShowcaseLinkForm, ShowcaseMainForm } from "@/features/showcase/showcase-forms";
import { getShowcaseByOrganization } from "@/features/showcase/queries";
import { requireOrganizationAccess } from "@/features/organizations/guards";

export default async function VitrinePage() {
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER"]);

  const { showcase, links } = await getShowcaseByOrganization(organization.id);

  return (
    <>
      <AppHeader title="Vitrine publica" eyebrow={organization.name} />
      <section className="grid gap-6 p-4 sm:p-6 lg:p-8 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Conteudo principal</CardTitle>
          </CardHeader>
          <CardContent>
            <ShowcaseMainForm showcase={showcase} organizationName={organization.name} />
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pagina publica</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-zinc-600">Quando publicada, a pagina fica acessivel pelo slug.</p>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/p/${organization.slug}`}>Abrir /p/{organization.slug}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Links rapidos</CardTitle>
            </CardHeader>
            <CardContent>
              <ShowcaseLinkForm />
              <div className="mt-5 grid gap-2">
                {links.length === 0 ? (
                  <p className="text-sm text-zinc-500">Nenhum link cadastrado.</p>
                ) : (
                  links.map((link) => (
                    <div key={link.id} className="rounded-lg border border-zinc-200 p-3 text-sm">
                      <strong>{link.label}</strong>
                      <p className="truncate text-zinc-500">{link.url}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
