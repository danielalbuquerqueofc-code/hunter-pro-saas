import { notFound } from "next/navigation";
import { CalendarDays, Clock3, Facebook, Instagram, MapPin, MessageCircle, Phone, Play, Share2, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestAppointmentAction } from "@/features/appointments/actions";
import { getPublicShowcase } from "@/features/showcase/queries";

type PublicShowcasePageProps = {
  params: Promise<{ slug: string }>;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function whatsappUrl(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}` : "#";
}

export default async function PublicShowcasePage({ params }: PublicShowcasePageProps) {
  const { slug } = await params;
  const data = await getPublicShowcase(slug);

  if (!data?.showcase) notFound();

  const showcase = data.showcase;
  const heroImage = showcase.hero_image_url;
  const themes = {
    clean_light: "bg-slate-50 text-slate-950",
    premium_dark: "bg-[#070b0f] text-white",
    beauty: "bg-pink-50 text-slate-950",
    wellness: "bg-emerald-50 text-slate-950",
    professional_blue: "bg-blue-50 text-slate-950",
    gold: "bg-amber-50 text-slate-950"
  };
  const pageTheme = themes[showcase.theme_key as keyof typeof themes] ?? themes.clean_light;

  return (
    <main className={`min-h-screen ${pageTheme}`}>
      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-4 sm:px-6 lg:grid-cols-[1fr_420px] lg:py-8">
        <div className="grid gap-5">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl">
            <div className="relative min-h-72 bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-950">
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-85" />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-[#070b0f] via-[#070b0f]/20 to-transparent" />
              <div className="relative flex min-h-72 flex-col justify-end p-5 sm:p-8">
                <div className="mb-4 flex w-fit items-center gap-2 rounded-full bg-black/40 px-3 py-2 text-sm font-bold backdrop-blur">
                  <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                  4,9 · Atendimento verificado
                </div>
                <div className="flex items-end gap-4">
                  {showcase.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={showcase.logo_url} alt="" className="h-20 w-20 rounded-[1.5rem] border-4 border-white object-cover shadow-xl" />
                  ) : null}
                  <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">{showcase.title}</h1>
                </div>
                {showcase.subtitle ? <p className="mt-3 max-w-2xl text-lg text-zinc-200">{showcase.subtitle}</p> : null}
              </div>
            </div>
            <div className="grid gap-4 p-5 sm:p-8">
              {showcase.description ? <p className="text-lg leading-8 text-zinc-300">{showcase.description}</p> : null}
              <div className="flex flex-wrap gap-3">
                <a href="#agendar" className="rounded-full bg-[var(--hp-accent)] px-6 py-4 font-black text-[#04100a]">
                  Agendar agora
                </a>
                <a href={whatsappUrl(showcase.whatsapp)} className="rounded-full border border-white/10 px-6 py-4 font-black text-white">
                  <MessageCircle className="mr-2 inline h-5 w-5" />
                  WhatsApp
                </a>
                {showcase.instagram_url ? (
                  <a href={showcase.instagram_url} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-6 py-4 font-black text-white">
                    <Instagram className="mr-2 inline h-5 w-5" />
                    Instagram
                  </a>
                ) : null}
                {showcase.facebook_url ? (
                  <a href={showcase.facebook_url} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-6 py-4 font-black text-white">
                    <Facebook className="mr-2 inline h-5 w-5" />
                    Facebook
                  </a>
                ) : null}
                {showcase.youtube_url ? (
                  <a href={showcase.youtube_url} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-6 py-4 font-black text-white">
                    <Play className="mr-2 inline h-5 w-5" />
                    YouTube
                  </a>
                ) : null}
                {showcase.phone ? (
                  <a href={`tel:${showcase.phone.replace(/\D/g, "")}`} className="rounded-full border border-white/10 px-6 py-4 font-black text-white">
                    <Phone className="mr-2 inline h-5 w-5" />
                    Ligar
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-[var(--hp-accent)]">Servicos</p>
                <h2 className="text-3xl font-black">Escolha o que precisa</h2>
              </div>
              <Sparkles className="h-7 w-7 text-zinc-500" />
            </div>
            <div className="mt-5 grid gap-3">
              {data.services.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 p-6 text-zinc-400">
                  Servicos em configuracao.
                </div>
              ) : (
                data.services.map((service) => (
                  <article key={service.id} className="rounded-[1.5rem] bg-white/[0.05] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black">{service.name}</h3>
                        <p className="mt-1 text-sm leading-6 text-zinc-400">{service.description ?? "Servico disponivel para agendamento online."}</p>
                      </div>
                      <p className="shrink-0 text-lg font-black text-[var(--hp-accent)]">{formatCurrency(service.price_cents)}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm font-bold text-zinc-500">
                      <Clock3 className="h-4 w-4" />
                      {service.duration_minutes} minutos
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            {[
              ["Agenda online", "Escolha dia e horario sem troca infinita de mensagens."],
              ["Atendimento simples", "Seu pedido chega direto para a equipe."],
              ["Link compartilhavel", "Envie a vitrine para amigos e contatos."]
            ].map(([title, description]) => (
              <div key={title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                <Share2 className="h-6 w-6 text-[var(--hp-accent)]" />
                <h3 className="mt-4 text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm text-zinc-500">{description}</p>
              </div>
            ))}
          </section>
        </div>

        <aside id="agendar" className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[2rem] border border-white/10 bg-white text-zinc-950 shadow-2xl">
            <div className="border-b border-zinc-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Agendar</h2>
                  <p className="text-sm text-zinc-500">Solicite seu horario em poucos passos.</p>
                </div>
              </div>
            </div>
            <form action={requestAppointmentAction} className="grid gap-4 p-5">
              <input type="hidden" name="organizationId" value={data.organization.id} />
              <div className="space-y-2">
                <Label htmlFor="serviceId">Servico</Label>
                <select id="serviceId" name="serviceId" className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950">
                  <option value="">Escolha um servico</option>
                  {data.services.map((service) => (
                    <option key={service.id} value={service.id}>{service.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="professionalId">Profissional</Label>
                <select id="professionalId" name="professionalId" className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950">
                  <option value="">Qualquer profissional</option>
                  {data.professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>{professional.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input id="date" name="date" type="date" required className="h-12 rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horario</Label>
                  <Input id="time" name="time" type="time" required className="h-12 rounded-2xl" />
                </div>
              </div>
              <Input name="customerName" placeholder="Seu nome" required className="h-12 rounded-2xl" />
              <Input name="customerPhone" placeholder="WhatsApp" required className="h-12 rounded-2xl" />
              <Input name="customerEmail" type="email" placeholder="E-mail" className="h-12 rounded-2xl" />
              <textarea
                name="notes"
                placeholder="Conte rapidamente o que voce precisa"
                className="min-h-24 rounded-2xl border border-zinc-200 p-3 text-sm"
              />
              <Button type="submit" className="h-14 rounded-full bg-[var(--hp-accent)] text-base font-black text-[#04100a] hover:bg-emerald-400">
                Enviar solicitacao
              </Button>
            </form>
          </div>

          <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-400">
              <MapPin className="h-4 w-4 text-[var(--hp-accent)]" />
              {showcase.address_text || "Atendimento local ou online conforme disponibilidade."}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
