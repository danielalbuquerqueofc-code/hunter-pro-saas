import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { pipelineSummary } from "@/features/dashboard/mock";

export function PipelineSummary() {
  return (
    <DashboardSection title="Funil de vendas" description="Resumo das etapas comerciais">
      <div className="space-y-3">
        {pipelineSummary.map((item) => (
          <div key={item.label} className="grid grid-cols-[1fr_120px_42px] items-center gap-3 text-sm">
            <span>{item.label}</span>
            <span className="h-3 rounded-full bg-slate-200">
              <span className="block h-3 rounded-full bg-brand-orange" style={{ width: `${item.value}%` }} />
            </span>
            <strong>{item.value}%</strong>
          </div>
        ))}
      </div>
    </DashboardSection>
  );
}
