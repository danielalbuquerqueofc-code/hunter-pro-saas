import { Flag } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { pendingTasks } from "@/features/dashboard/mock";

export function TaskList() {
  return (
    <DashboardSection title="Tarefas pendentes" description="Prioridades para configurar a operacao">
      <div className="space-y-3">
        {pendingTasks.map((task) => (
          <div key={task.title} className="rounded-lg border border-zinc-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{task.title}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {task.due} - {task.owner}
                </p>
              </div>
              <StatusBadge variant={task.priority === "Alta" ? "danger" : task.priority === "Media" ? "warning" : "neutral"}>
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
