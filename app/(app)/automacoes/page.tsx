import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AutomationForm } from "@/features/operations/operation-forms";
import { getOperationsData } from "@/features/operations/queries";
import { requireOrganizationAccess } from "@/features/organizations/guards";

export default async function AutomacoesPage() {
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER"]);

  const { automations } = await getOperationsData(organization.id);

  return (
    <>
      <AppHeader title="Automacoes" eyebrow={organization.name} />
      <section className="grid gap-6 p-4 sm:p-6 lg:p-8 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader><CardTitle>Nova automacao</CardTitle></CardHeader>
          <CardContent>
            <AutomationForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Fluxos</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {automations.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhuma automacao cadastrada.</p>
            ) : automations.map((automation) => (
              <div key={automation.id} className="rounded-lg border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-bold">{automation.name}</h2>
                    <p className="text-sm text-zinc-500">{automation.trigger_key}</p>
                  </div>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-brand-orange">{automation.status}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-600">{automation.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
