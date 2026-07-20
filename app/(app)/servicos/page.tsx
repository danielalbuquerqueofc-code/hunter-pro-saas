import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServicesData } from "@/features/services/queries";
import { ServiceForms } from "@/features/services/service-forms";
import { requireOrganizationAccess } from "@/features/organizations/guards";

export default async function ServicosPage() {
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER"]);

  const { categories, services } = await getServicesData(organization.id);

  return (
    <>
      <AppHeader title="Servicos" eyebrow={organization.name} />
      <section className="grid gap-6 p-4 sm:p-6 lg:p-8 xl:grid-cols-[420px_1fr]">
        <ServiceForms categories={categories} />

        <Card>
          <CardHeader><CardTitle>Servicos cadastrados</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {services.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhum servico cadastrado ainda.</p>
            ) : (
              services.map((service) => {
                const category = Array.isArray(service.category) ? service.category[0] : service.category;
                return (
                  <div key={service.id} className="rounded-lg border border-zinc-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-bold">{service.name}</h2>
                        <p className="text-sm text-zinc-500">{category?.name ?? "Sem categoria"}</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        {service.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-zinc-600">{service.description}</p>
                    <p className="mt-3 text-sm font-semibold">{service.duration_minutes} min - R$ {(service.price_cents / 100).toFixed(2)}</p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
