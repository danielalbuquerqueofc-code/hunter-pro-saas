import { Flag } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { StatusBadge } from "@/components/dashboard/status-badge";

type Task = {
  id: string;
  title: string;
  priority: string;
  status: string;
  due_at: string | null;
};

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <DashboardSection title="Tarefas pendentes" description="Prioridades para configurar a operacao">
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="rounded-lg bg-zinc-50 p-4 text-sm font-semibold text-zinc-600">
            Nenhuma tarefa aberta.
          </p>
        ) : tasks.map((task) => (
          <div key={task.id} className="rounded-lg border border-zinc-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{task.title}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {task.due_at ? new Date(task.due_at).toLocaleString("pt-BR") : "Sem prazo"} - {task.status}
                </p>
              </div>
              <StatusBadge variant={task.priority === "URGENT" || task.priority === "HIGH" ? "danger" : task.priority === "MEDIUM" ? "warning" : "neutral"}>
                <Flag className="mr-1 inline h-3 w-3" />
                {task.priority}
              </StatusBadge>
            </div>
          </div>
        ))}
      </div>
    </DashboardSection>
  );
}
