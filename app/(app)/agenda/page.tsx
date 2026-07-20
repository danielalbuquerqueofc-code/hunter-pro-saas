import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  GripVertical,
  MoveRight,
  Plus,
  RotateCcw,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  createAvailabilityRuleAction,
  createBlockedTimeAction,
  saveSchedulingSettingsAction
} from "@/features/appointments/actions";
import { ProfessionalsPanel } from "@/features/appointments/professionals-panel";
import { getAgendaData } from "@/features/appointments/queries";
import { requireOrganizationAccess } from "@/features/organizations/guards";

const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const fullWeekdays = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];
const hours = ["08:00", "09:00", "10:30", "12:00", "14:00", "15:30", "17:00", "19:00"];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function getWeekDays() {
  const today = new Date();
  const current = today.getDay();
  return weekdays.map((label, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index - current);
    return {
      label,
      number: date.getDate(),
      active: index === current
    };
  });
}

export default async function AgendaPage() {
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "ATTENDANT", "PROFESSIONAL"]);
  const { professionals, rules, appointments, blockedTimes, integrations } = await getAgendaData(organization.id);
  const weekDays = getWeekDays();
  const upcoming = appointments.slice(0, 8);
  const googleIntegration = integrations.find((integration) => integration.provider === "GOOGLE_CALENDAR");
  const whatsappIntegration = integrations.find((integration) => integration.provider === "WHATSAPP");

  return (
    <section className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
      <div className="grid gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-[var(--hp-accent)]">{organization.name}</p>
            <h1 className="mt-1 text-4xl font-black tracking-tight">Agenda</h1>
            <p className="mt-2 text-zinc-400">Organize o dia com poucos toques.</p>
          </div>
          <Button className="h-12 rounded-full bg-[var(--hp-accent)] px-5 font-black text-[#04100a] hover:bg-emerald-400">
            <Plus className="mr-2 h-5 w-5" />
            Novo
          </Button>
        </div>

        <div className="hp-card rounded-[2rem] p-4">
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <button
                key={day.label}
                type="button"
                className={`rounded-2xl px-2 py-3 text-center transition ${
                  day.active ? "bg-[var(--hp-accent)] text-[#04100a]" : "bg-slate-50 text-zinc-400"
                }`}
              >
                <span className="block text-xs font-bold">{day.label}</span>
                <span className="mt-1 block text-lg font-black">{day.number}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="hp-card rounded-[2rem] p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-[var(--hp-accent)]">Hoje</p>
              <h2 className="text-2xl font-black">{formatDate(new Date())}</h2>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">
              {upcoming.length} horarios
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {hours.map((hour, index) => {
              const appointment = upcoming[index];
              const service = appointment
                ? Array.isArray(appointment.service)
                  ? appointment.service[0]
                  : appointment.service
                : null;
              const professional = appointment
                ? Array.isArray(appointment.professional)
                  ? appointment.professional[0]
                  : appointment.professional
                : null;

              return (
                <div key={hour} className="grid grid-cols-[58px_1fr] gap-3">
                  <div className="pt-4 text-sm font-bold text-zinc-500">{appointment ? formatTime(appointment.starts_at) : hour}</div>
                  {appointment ? (
                    <article
                      draggable
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-400/40 hover:bg-slate-100"
                    >
                      <div className="flex items-start gap-3">
                        <GripVertical className="mt-1 h-5 w-5 shrink-0 text-zinc-500" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="truncate text-lg font-black">{appointment.customer_name}</h3>
                              <p className="text-sm text-zinc-400">{service?.name ?? "Servico nao informado"}</p>
                            </div>
                            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-black text-[var(--hp-accent)]">
                              {appointment.status}
                            </span>
                          </div>
                          <p className="mt-3 text-sm text-zinc-500">{professional?.name ?? "Sem profissional"} · {appointment.customer_phone}</p>
                          <div className="mt-4 grid grid-cols-3 gap-2">
                            <button type="button" className="rounded-full bg-emerald-400/10 px-3 py-2 text-xs font-black text-[var(--hp-accent)]">
                              <CheckCircle2 className="mx-auto mb-1 h-4 w-4" />
                              Confirmar
                            </button>
                            <button type="button" className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">
                              <RotateCcw className="mx-auto mb-1 h-4 w-4" />
                              Remarcar
                            </button>
                            <button type="button" className="rounded-full bg-red-500/10 px-3 py-2 text-xs font-black text-red-300">
                              <XCircle className="mx-auto mb-1 h-4 w-4" />
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ) : (
                    <div className="rounded-[1.5rem] border border-dashed border-slate-200 p-4 text-sm text-zinc-500">
                      Arraste um atendimento para este horario ou toque em Novo.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="grid gap-5 lg:content-start">
        <Card className="hp-card rounded-[2rem] border-slate-200 bg-transparent text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Clock3 className="h-5 w-5 text-[var(--hp-accent)]" />
              Disponibilidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createAvailabilityRuleAction} className="grid gap-3">
              <Select name="professionalId" className="h-12 rounded-2xl border-slate-200 bg-white text-slate-950">
                <option value="">Todos os profissionais</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>{professional.name}</option>
                ))}
              </Select>
              <Select name="weekday" className="h-12 rounded-2xl border-slate-200 bg-white text-slate-950">
                {fullWeekdays.map((weekday, index) => (
                  <option key={weekday} value={index}>{weekday}</option>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input name="startTime" type="time" defaultValue="09:00" required className="h-12 rounded-2xl border-slate-200 bg-white text-slate-950" />
                <Input name="endTime" type="time" defaultValue="18:00" required className="h-12 rounded-2xl border-slate-200 bg-white text-slate-950" />
              </div>
              <Button type="submit" className="h-12 rounded-full bg-white text-[#04100a] font-black hover:bg-zinc-100">
                Salvar turno
              </Button>
            </form>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              Para criar almoco, pausas ou mais de um turno no mesmo dia, cadastre turnos separados. Ex.: 08:00-12:00 e 13:00-17:00.
            </p>
          </CardContent>
        </Card>

        <Card className="hp-card rounded-[2rem] border-slate-200 bg-transparent text-white">
          <CardHeader>
            <CardTitle className="text-xl">Configuracao da agenda</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveSchedulingSettingsAction} className="grid gap-3">
              <Input name="timezone" defaultValue={organization.timezone ?? "America/Sao_Paulo"} className="h-12 rounded-2xl border-slate-200 bg-white text-slate-950" />
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-zinc-500">
                  Margem entre atendimentos
                  <Input name="defaultMarginMinutes" type="number" defaultValue={organization.default_appointment_margin_minutes ?? 10} min={0} className="mt-1 h-12 rounded-2xl border-slate-200 bg-white text-slate-950" />
                </label>
                <label className="text-xs font-bold text-zinc-500">
                  Antecedencia minima
                  <Input name="minNoticeMinutes" type="number" defaultValue={organization.booking_min_notice_minutes ?? 120} min={0} className="mt-1 h-12 rounded-2xl border-slate-200 bg-white text-slate-950" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-zinc-500">
                  Dias futuros
                  <Input name="maxDaysAhead" type="number" defaultValue={organization.booking_max_days_ahead ?? 30} min={1} className="mt-1 h-12 rounded-2xl border-slate-200 bg-white text-slate-950" />
                </label>
                <label className="text-xs font-bold text-zinc-500">
                  Grade
                  <Select name="slotIntervalMinutes" defaultValue={String(organization.booking_slot_interval_minutes ?? 15)} className="mt-1 h-12 rounded-2xl border-slate-200 bg-white text-slate-950">
                    <option value="5">5 minutos</option>
                    <option value="10">10 minutos</option>
                    <option value="15">15 minutos</option>
                    <option value="30">30 minutos</option>
                  </Select>
                </label>
              </div>
              <Select name="slotMode" defaultValue={organization.booking_slot_mode ?? "FIXED_GRID"} className="h-12 rounded-2xl border-slate-200 bg-white text-slate-950">
                <option value="FIXED_GRID">Grade fixa de inicio</option>
                <option value="SEQUENTIAL_BLOCKS">Blocos sequenciais</option>
              </Select>
              <Select name="confirmationMode" defaultValue={organization.booking_confirmation_mode ?? "AUTOMATIC"} className="h-12 rounded-2xl border-slate-200 bg-white text-slate-950">
                <option value="AUTOMATIC">Confirmacao automatica</option>
                <option value="MANUAL">Aprovacao manual</option>
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input name="quietStart" type="time" defaultValue={organization.quiet_hours_start ?? "21:00"} className="h-12 rounded-2xl border-slate-200 bg-white text-slate-950" />
                <Input name="quietEnd" type="time" defaultValue={organization.quiet_hours_end ?? "08:00"} className="h-12 rounded-2xl border-slate-200 bg-white text-slate-950" />
              </div>
              <Select name="quietPolicy" defaultValue={organization.quiet_hours_policy ?? "DELAY"} className="h-12 rounded-2xl border-slate-200 bg-white text-slate-950">
                <option value="DELAY">Adiar mensagens</option>
                <option value="ADVANCE">Antecipar mensagens</option>
                <option value="SKIP">Ignorar lembrete</option>
              </Select>
              <Button type="submit" className="h-12 rounded-full bg-white text-[#04100a] font-black hover:bg-zinc-100">
                Salvar configuracoes
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="hp-card rounded-[2rem] border-slate-200 bg-transparent text-white">
          <CardHeader>
            <CardTitle className="text-xl">Bloqueios, folgas e feriados</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form action={createBlockedTimeAction} className="grid gap-3">
              <Select name="professionalId" className="h-12 rounded-2xl border-slate-200 bg-white text-slate-950">
                <option value="">Todos os profissionais</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>{professional.name}</option>
                ))}
              </Select>
              <Input name="date" type="date" required className="h-12 rounded-2xl border-slate-200 bg-white text-slate-950" />
              <div className="grid grid-cols-2 gap-3">
                <Input name="startTime" type="time" defaultValue="00:00" className="h-12 rounded-2xl border-slate-200 bg-white text-slate-950" />
                <Input name="endTime" type="time" defaultValue="23:59" className="h-12 rounded-2xl border-slate-200 bg-white text-slate-950" />
              </div>
              <Select name="blockType" className="h-12 rounded-2xl border-slate-200 bg-white text-slate-950">
                <option value="MANUAL">Bloqueio pontual</option>
                <option value="LUNCH">Almoco</option>
                <option value="BREAK">Pausa</option>
                <option value="VACATION">Ferias</option>
                <option value="HOLIDAY">Feriado</option>
              </Select>
              <Input name="reason" placeholder="Motivo" className="h-12 rounded-2xl border-slate-200 bg-white text-slate-950" />
              <Button type="submit" className="h-12 rounded-full bg-white text-[#04100a] font-black hover:bg-zinc-100">
                Criar bloqueio
              </Button>
            </form>
            {blockedTimes.length ? (
              <div className="grid gap-2">
                {blockedTimes.slice(0, 4).map((block) => {
                  const professional = Array.isArray(block.professional) ? block.professional[0] : block.professional;
                  return (
                    <div key={block.id} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                      <strong>{professional?.name ?? "Todos"}</strong>
                      <p>{formatTime(block.starts_at)} ate {formatTime(block.ends_at)} · {block.reason ?? block.block_type}</p>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="hp-card rounded-[2rem] border-slate-200 bg-transparent text-white">
          <CardHeader>
            <CardTitle className="text-xl">Integracoes da agenda</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="rounded-2xl bg-slate-50 p-3 text-slate-700">
              <strong>Google Calendar</strong>
              <p>Status: {googleIntegration?.status ?? "DISCONNECTED"}</p>
              <p className="text-xs text-slate-500">Eventos externos so bloqueiam horarios apos OAuth oficial conectado.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 text-slate-700">
              <strong>WhatsApp</strong>
              <p>Status: {whatsappIntegration?.status ?? "DISCONNECTED"}</p>
              <p className="text-xs text-slate-500">Lembretes sao enfileirados; envio real depende de provedor autorizado.</p>
            </div>
          </CardContent>
        </Card>

        <ProfessionalsPanel professionals={professionals} />

        <Card className="hp-card rounded-[2rem] border-slate-200 bg-transparent text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarCheck className="h-5 w-5 text-[var(--hp-accent)]" />
              Regras ativas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {rules.length === 0 ? (
              <p className="text-sm text-zinc-400">Nenhuma regra cadastrada.</p>
            ) : (
              rules.slice(0, 5).map((rule) => {
                const professional = Array.isArray(rule.professional) ? rule.professional[0] : rule.professional;
                return (
                  <div key={rule.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm">
                    <div>
                      <strong>{fullWeekdays[rule.weekday]}</strong>
                      <p className="text-zinc-500">{professional?.name ?? "Todos"}</p>
                    </div>
                    <span className="flex items-center gap-1 text-slate-600">
                      {rule.start_time} <MoveRight className="h-3 w-3" /> {rule.end_time}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </aside>
    </section>
  );
}
