import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { setupChecklist, type SetupChecklistItem } from "@/features/dashboard/mock";

type SetupChecklistProps = {
  items?: SetupChecklistItem[];
};

export function SetupChecklist({ items = setupChecklist }: SetupChecklistProps) {
  const completedWeight = items
    .filter((item) => item.done)
    .reduce((total, item) => total + item.weight, 0);

  return (
    <DashboardSection
      title="Configure sua empresa"
      description="Complete os passos essenciais para vender e atender melhor"
      action={
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-brand-orange">
          {completedWeight}%
        </span>
      }
    >
      <div className="mb-4 h-3 rounded-full bg-zinc-100">
        <div className="h-3 rounded-full bg-brand-orange" style={{ width: `${completedWeight}%` }} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 text-sm font-semibold hover:border-orange-200 hover:bg-orange-50"
          >
            {item.done ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Circle className="h-5 w-5 text-zinc-400" />
            )}
            {item.label}
          </Link>
        ))}
      </div>
    </DashboardSection>
  );
}
