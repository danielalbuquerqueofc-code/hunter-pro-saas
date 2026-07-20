import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

export function DashboardCalendar({ appointmentDays }: { appointmentDays: number[] }) {
  const now = new Date();
  const today = now.getDate();
  const monthDays = Array.from(
    { length: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() },
    (_, index) => index + 1
  );
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(now);
  const hasToday = appointmentDays.includes(today);

  return (
    <DashboardSection
      title="Calendario mensal"
      description={monthLabel}
    >
      <div className="mb-4 flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
        <CalendarDays className="h-4 w-4" />
        {hasToday ? "Existem agendamentos hoje" : "Sem agendamentos hoje"}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-zinc-500">
        {weekDays.map((day) => (
          <span key={day} className="py-2">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {monthDays.map((day) => (
          <Link
            key={day}
            href="/agenda"
            className={`relative flex aspect-square items-center justify-center rounded-md text-sm font-bold ${
              day === today
                ? "bg-brand-orange text-white"
                : "bg-[#eef1f7] text-zinc-900 hover:bg-orange-100"
            }`}
          >
            {day}
            {appointmentDays.includes(day) ? (
              <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
            ) : null}
          </Link>
        ))}
      </div>
    </DashboardSection>
  );
}
