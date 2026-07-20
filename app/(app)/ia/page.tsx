import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiAgentForm } from "@/features/ai/ai-agent-form";
import { getAiData } from "@/features/ai/queries";
import { requireOrganizationAccess } from "@/features/organizations/guards";

export default async function IaPage() {
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER"]);

  const { agents, runs, integrations, events } = await getAiData(organization.id);

  return (
    <>
      <AppHeader title="IA SDR" eyebrow={organization.name} />
      <section className="grid gap-6 p-4 sm:p-6 lg:p-8 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader><CardTitle>Novo agente</CardTitle></CardHeader>
          <CardContent>
            <AiAgentForm />
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader><CardTitle>Agentes</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              {agents.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhum agente criado.</p>
              ) : agents.map((agent) => (
                <div key={agent.id} className="rounded-lg border border-zinc-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-bold">{agent.name}</h2>
                      <p className="text-sm text-zinc-500">{agent.goal}</p>
                    </div>
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-brand-orange">{agent.status}</span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm text-zinc-600">{agent.instructions}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card><CardContent className="p-5"><p className="text-sm font-bold text-zinc-700">Execucoes</p><p className="mt-2 text-3xl font-black">{runs.length}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm font-bold text-zinc-700">Integracoes</p><p className="mt-2 text-3xl font-black">{integrations.length}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm font-bold text-zinc-700">Eventos</p><p className="mt-2 text-3xl font-black">{events.length}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Seguranca de IA</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-sm text-zinc-600">
              <p>Esta fase prepara a estrutura. A chamada real para IA deve usar chave segura no servidor.</p>
              <p>Prompts, respostas e eventos ficam isolados por empresa via RLS.</p>
              <p>Dados pessoais devem ser usados apenas com finalidade comercial registrada e base legal adequada.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
