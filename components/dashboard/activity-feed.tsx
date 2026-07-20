import { CheckCircle2 } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export function ActivityFeed({ items }: { items: Array<{ id: string; title: string; type: string; created_at: string }> }) {
  return (
    <DashboardSection title="Ultimas atividades" description="Eventos recentes da operacao">
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="rounded-lg bg-zinc-50 p-4 text-sm font-semibold text-zinc-600">
            Nenhuma atividade comercial registrada ainda.
          </p>
        ) : items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3 text-sm font-semibold">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span>
              {item.title}
              <span className="ml-2 text-xs font-bold text-zinc-500">{item.type}</span>
            </span>
          </div>
        ))}
      </div>
    </DashboardSection>
  );
}
