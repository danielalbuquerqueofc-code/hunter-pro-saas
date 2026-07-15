import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createAvailabilityRuleAction } from "@/features/appointments/actions";
import { ProfessionalsPanel } from "@/features/appointments/professionals-panel";
import { getAgendaData } from "@/features/appointments/queries";
import { getCurrentOrganization } from "@/features/organizations/current";
import { requireUser } from "@/lib/auth";

const weekdays = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];

export default async function AgendaPage() {
  const user = await requireUser();
  const { organization } = await getCurrentOrganization(user.id);

  if (!organization) {
    return (
      <>
        <AppHeader title="Agenda" eyebrow="Fase 2" />
        <section className="p-8">
          <Card><CardContent className="p-6">Cadastre sua empresa antes da agenda.</CardContent></Card>
        </section>
      </>
    );
  }

  const { professionals, rules, appointments } = await getAgendaData(organization.id);

  return (
    <>
      <AppHeader title="Agenda" eyebrow={organization.name} />
      <section className="grid gap-6 p-4 sm:p-6 lg:p-8 xl:grid-cols-[460px_1fr]">
        <div className="grid gap-6">
          <ProfessionalsPanel professionals={professionals} />

          <Card>
            <CardHeader><CardTitle>Disponibilidade</CardTitle></CardHeader>
            <CardContent>
              <form action={createAvailabilityRuleAction} className="grid gap-3">
                <Select name="professionalId">
                  <option value="">Todos os profissionais</option>
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>{professional.name}</option>
                  ))}
                </Select>
                <Select name="weekday">
                  {weekdays.map((weekday, index) => (
                    <option key={weekday} value={index}>{weekday}</option>
                  ))}
                </Select>
                <div className="grid grid-cols-2 gap-3">
                  <Input name="startTime" type="time" defaultValue="09:00" required />
                  <Input name="endTime" type="time" defaultValue="18:00" required />
                </div>
                <Button type="submit">Adicionar horario</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader><CardTitle>Solicitacoes de agendamento</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              {appointments.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhum agendamento recebido ainda.</p>
              ) : (
                appointments.map((appointment) => {
                  const service = Array.isArray(appointment.service) ? appointment.service[0] : appointment.service;
                  const professional = Array.isArray(appointment.professional) ? appointment.professional[0] : appointment.professional;
                  return (
                    <div key={appointment.id} className="rounded-lg border border-zinc-200 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="font-bold">{appointment.customer_name}</h2>
                          <p className="text-sm text-zinc-500">{service?.name ?? "Servico nao informado"}</p>
                        </div>
                        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-brand-orange">{appointment.status}</span>
                      </div>
                      <p className="mt-3 text-sm text-zinc-600">
                        {new Date(appointment.starts_at).toLocaleString("pt-BR")} - {professional?.name ?? "sem profissional"}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">{appointment.customer_phone}</p>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Regras cadastradas</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              {rules.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhuma regra de horario cadastrada.</p>
              ) : (
                rules.map((rule) => {
                  const professional = Array.isArray(rule.professional) ? rule.professional[0] : rule.professional;
                  return (
                    <div key={rule.id} className="rounded-lg border border-zinc-200 p-3 text-sm">
                      <strong>{weekdays[rule.weekday]}</strong> {rule.start_time} as {rule.end_time}
                      <p className="text-zinc-500">{professional?.name ?? "Todos os profissionais"}</p>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
