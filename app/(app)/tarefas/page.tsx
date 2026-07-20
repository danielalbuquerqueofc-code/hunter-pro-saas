import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskForm } from "@/features/operations/operation-forms";
import { getOperationsData } from "@/features/operations/queries";
import { requireOrganizationAccess } from "@/features/organizations/guards";

export default async function TarefasPage() {
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT", "PROFESSIONAL", "FINANCIAL"]);

  const { tasks, contacts, deals } = await getOperationsData(organization.id);

  return (
    <>
      <AppHeader title="Tarefas" eyebrow={organization.name} />
      <section className="grid gap-6 p-4 sm:p-6 lg:p-8 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader><CardTitle>Nova tarefa</CardTitle></CardHeader>
          <CardContent>
            <TaskForm contacts={contacts} deals={deals} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Lista de tarefas</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhuma tarefa cadastrada.</p>
            ) : tasks.map((task) => {
              const contact = Array.isArray(task.contact) ? task.contact[0] : task.contact;
              const deal = Array.isArray(task.deal) ? task.deal[0] : task.deal;
              return (
                <div key={task.id} className="rounded-lg border border-zinc-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-bold">{task.title}</h2>
                      <p className="text-sm text-zinc-500">{contact?.name ?? "Sem contato"} {deal?.title ? `- ${deal.title}` : ""}</p>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold">{task.priority}</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">{task.description}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
