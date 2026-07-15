import { Eye } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { todayAppointments } from "@/features/dashboard/mock";

export function TodayAppointments() {
  return (
    <DashboardSection title="Agenda de hoje" description="Atendimentos, status e valores do dia">
      <div className="space-y-3">
        {todayAppointments.map((appointment) => (
          <div
            key={`${appointment.time}-${appointment.customer}`}
            className="grid gap-3 rounded-lg border border-zinc-200 p-4 text-sm md:grid-cols-[72px_1fr_120px_100px_40px] md:items-center"
          >
            <strong>{appointment.time}</strong>
            <div>
              <p className="font-black">{appointment.customer}</p>
              <p className="text-zinc-500">
                {appointment.service} - {appointment.professional}
              </p>
            </div>
            <StatusBadge variant="warning">{appointment.status}</StatusBadge>
            <strong>{appointment.value}</strong>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-100 text-zinc-600"
              type="button"
              aria-label="Abrir detalhes"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </DashboardSection>
  );
}
