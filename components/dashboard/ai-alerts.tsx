import { Sparkles } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export function AiAlerts({ alerts }: { alerts: string[] }) {
  return (
    <DashboardSection title="Alertas e oportunidades da IA" description="Sinais baseados na configuracao atual">
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert} className="flex gap-3 rounded-lg bg-violet-50 p-3 text-sm font-semibold text-violet-800">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            {alert}
          </div>
        ))}
      </div>
    </DashboardSection>
  );
}
