import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CrmActivityForm, CrmForms } from "@/features/crm/crm-forms";
import { getCrmData } from "@/features/crm/queries";
import { requireOrganizationAccess } from "@/features/organizations/guards";

export default async function CrmPage() {
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT"]);

  const { contacts, stages, deals, activities } = await getCrmData(organization.id);
  const totalPipeline = deals.reduce((sum, deal) => sum + Number(deal.value_cents ?? 0), 0);
  const openDeals = deals.filter((deal) => deal.status === "OPEN");

  return (
    <>
      <AppHeader title="CRM Comercial" eyebrow={organization.name} />
      <section className="grid gap-6 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-bold text-emerald-700">Leads</p>
              <p className="mt-2 text-3xl font-black">{contacts.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-bold text-emerald-700">Oportunidades</p>
              <p className="mt-2 text-3xl font-black">{openDeals.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-bold text-emerald-700">Pipeline</p>
              <p className="mt-2 text-3xl font-black">R$ {(totalPipeline / 100).toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-bold text-emerald-700">Atividades</p>
              <p className="mt-2 text-3xl font-black">{activities.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <CrmForms contacts={contacts} />

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                {stages.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    Crie a primeira oportunidade para gerar o pipeline padrao.
                  </p>
                ) : (
                  <div className="grid gap-3 xl:grid-cols-3">
                    {stages.map((stage) => {
                      const stageDeals = deals.filter((deal) => deal.stage_id === stage.id);
                      return (
                        <div key={stage.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <h2 className="text-sm font-black">{stage.name}</h2>
                            <span className="rounded-full bg-white px-2 py-1 text-xs font-bold">
                              {stageDeals.length}
                            </span>
                          </div>
                          <div className="grid gap-2">
                            {stageDeals.map((deal) => {
                              const contact = Array.isArray(deal.contact) ? deal.contact[0] : deal.contact;
                              return (
                                <div key={deal.id} className="rounded-lg bg-white p-3 shadow-sm">
                                  <p className="font-bold">{deal.title}</p>
                                  <p className="text-xs text-zinc-500">{contact?.name ?? "Sem contato"}</p>
                                  <p className="mt-2 text-sm font-black text-brand-orange">
                                    R$ {(deal.value_cents / 100).toFixed(2)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atividades</CardTitle>
              </CardHeader>
              <CardContent>
                <CrmActivityForm contacts={contacts} deals={deals} />
                <div className="grid gap-2">
                  {activities.length === 0 ? (
                    <p className="text-sm text-zinc-500">Nenhuma atividade registrada.</p>
                  ) : (
                    activities.map((activity) => (
                      <div key={activity.id} className="rounded-lg border border-zinc-200 p-3 text-sm">
                        <strong>{activity.title}</strong>
                        <p className="text-zinc-500">{activity.type}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
