import { DashboardSection } from "@/components/dashboard/dashboard-section";

export function PipelineSummary({ items }: { items: Array<{ label: string; count: number }> }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <DashboardSection title="Funil de vendas" description="Resumo das etapas comerciais">
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="rounded-lg bg-zinc-50 p-4 text-sm font-semibold text-zinc-600">
            Nenhuma etapa de pipeline ativa ainda.
          </p>
        ) : items.map((item) => {
          const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
          <div key={item.label} className="grid grid-cols-[1fr_120px_42px] items-center gap-3 text-sm">
            <span>{item.label}</span>
            <span className="h-3 rounded-full bg-slate-200">
              <span className="block h-3 rounded-full bg-brand-orange" style={{ width: `${percent}%` }} />
            </span>
            <strong>{item.count}</strong>
          </div>
        )})}
      </div>
    </DashboardSection>
  );
}
