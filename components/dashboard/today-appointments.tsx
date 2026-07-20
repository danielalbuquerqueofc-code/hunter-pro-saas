import { Eye } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { StatusBadge } from "@/components/dashboard/status-badge";

type Appointment = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  status: string;
  starts_at: string;
  service: { name: string; price_cents?: number | null } | null;
  professional: { name: string } | null;
};

function formatCurrency(cents?: number | null) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((cents ?? 0) / 100);
}

export function TodayAppointments({ appointments }: { appointments: Appointment[] }) {
  return (
    <DashboardSection title="Agenda de hoje" description="Atendimentos, status e valores do dia">
      <div className="space-y-3">
        {appointments.length === 0 ? (
          <p className="rounded-lg bg-zinc-50 p-4 text-sm font-semibold text-zinc-600">
            Nenhum agendamento para hoje.
          </p>
        ) : appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="grid gap-3 rounded-lg border border-zinc-200 p-4 text-sm md:grid-cols-[72px_1fr_120px_100px_40px] md:items-center"
          >
            <strong>{new Date(appointment.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</strong>
            <div>
              <p className="font-black">{appointment.customer_name}</p>
              <p className="text-zinc-500">
                {appointment.service?.name ?? "Servico nao informado"} - {appointment.professional?.name ?? "sem profissional"}
              </p>
            </div>
            <StatusBadge variant="warning">{appointment.status}</StatusBadge>
            <strong>{formatCurrency(appointment.service?.price_cents)}</strong>
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
