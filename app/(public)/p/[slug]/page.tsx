import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestAppointmentAction } from "@/features/appointments/actions";
import { getPublicShowcase } from "@/features/showcase/queries";

type PublicShowcasePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PublicShowcasePage({ params }: PublicShowcasePageProps) {
  const { slug } = await params;
  const data = await getPublicShowcase(slug);

  if (!data?.showcase) notFound();

  return (
    <main className="min-h-screen bg-brand-ink text-white">
      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-brand-orange">Agenda online</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-tight">
            {data.showcase.title}
          </h1>
          {data.showcase.subtitle ? (
            <p className="mt-4 max-w-2xl text-xl text-zinc-300">{data.showcase.subtitle}</p>
          ) : null}
          {data.showcase.description ? (
            <p className="mt-6 max-w-3xl leading-8 text-zinc-300">{data.showcase.description}</p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            {data.links.map((link) => (
              <Button key={link.id} asChild variant="secondary">
                <a href={link.url} target="_blank" rel="noreferrer">{link.label}</a>
              </Button>
            ))}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {data.services.length === 0 ? (
              <Card className="border-white/10 bg-white/5 text-white">
                <CardContent className="p-6 text-zinc-300">Servicos em configuracao.</CardContent>
              </Card>
            ) : (
              data.services.map((service) => (
                <Card key={service.id} className="border-white/10 bg-white/5 text-white">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold">{service.name}</h2>
                    <p className="mt-2 text-sm text-zinc-300">{service.description}</p>
                    <p className="mt-5 text-sm font-bold text-brand-orange">
                      {service.duration_minutes} min - R$ {(service.price_cents / 100).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <Card className="h-fit border-white/10 bg-white text-zinc-950">
          <CardContent className="p-6">
            <h2 className="text-2xl font-black">Solicitar agendamento</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Preencha os dados e a equipe recebe sua solicitacao no painel.
            </p>
            <form action={requestAppointmentAction} className="mt-6 grid gap-4">
              <input type="hidden" name="organizationId" value={data.organization.id} />
              <div className="space-y-2">
                <Label htmlFor="serviceId">Servico</Label>
                <select id="serviceId" name="serviceId" className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-950">
                  <option value="">Escolha um servico</option>
                  {data.services.map((service) => (
                    <option key={service.id} value={service.id}>{service.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="professionalId">Profissional</Label>
                <select id="professionalId" name="professionalId" className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-950">
                  <option value="">Qualquer profissional</option>
                  {data.professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>{professional.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input id="date" name="date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horario</Label>
                  <Input id="time" name="time" type="time" required />
                </div>
              </div>
              <Input name="customerName" placeholder="Seu nome" required />
              <Input name="customerPhone" placeholder="WhatsApp" required />
              <Input name="customerEmail" type="email" placeholder="E-mail" />
              <textarea
                name="notes"
                placeholder="Conte rapidamente o que voce precisa"
                className="min-h-24 rounded-lg border border-zinc-200 p-3 text-sm"
              />
              <Button type="submit">Enviar solicitacao</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
