import { CheckCircle2 } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { activityFeed } from "@/features/dashboard/mock";

export function ActivityFeed() {
  return (
    <DashboardSection title="Ultimas atividades" description="Eventos recentes da operacao">
      <div className="space-y-3">
        {activityFeed.map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3 text-sm font-semibold">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            {item}
          </div>
        ))}
      </div>
    </DashboardSection>
  );
}
