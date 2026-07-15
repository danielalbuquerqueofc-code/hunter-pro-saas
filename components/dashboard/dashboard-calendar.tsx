import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const monthDays = Array.from({ length: 31 }, (_, index) => index + 1);

export function DashboardCalendar() {
  const today = new Date().getDate();

  return (
    <DashboardSection
      title="Calendario mensal"
      description="Julho / 2026"
      action={
        <div className="flex gap-1">
          <button className="rounded-md border border-zinc-200 p-2 text-zinc-500" type="button" aria-label="Mes anterior">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="rounded-md border border-zinc-200 p-2 text-zinc-500" type="button" aria-label="Proximo mes">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      }
    >
      <div className="mb-4 flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
        <CalendarDays className="h-4 w-4" />
        Sem agendamentos hoje
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
            {[7, 18, 24].includes(day) ? (
              <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
            ) : null}
          </Link>
        ))}
      </div>
    </DashboardSection>
  );
}
