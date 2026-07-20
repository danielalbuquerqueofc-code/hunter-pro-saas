import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Heart,
  Instagram,
  Lock,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestAppointmentAction } from "@/features/appointments/actions";
import { getPublicShowcase } from "@/features/showcase/queries";

type PublicShowcasePageProps = {
  params: Promise<{ slug: string }>;
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  duration_minutes: number;
  price_cents: number;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function initials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase();
}

function whatsappUrl(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}` : "#";
}

function fallbackServiceImage(index: number) {
  const gradients = [
    "from-rose-100 via-pink-50 to-white",
    "from-amber-100 via-rose-50 to-white",
    "from-fuchsia-100 via-pink-50 to-white",
    "from-stone-100 via-rose-50 to-white"
  ];
  return gradients[index % gradients.length];
}

function ServiceImage({ service, index, className = "" }: { service: Service; index: number; className?: string }) {
  if (service.image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={service.image_url} alt="" className={`object-cover ${className}`} />
    );
  }

  return (
    <div className={`bg-gradient-to-br ${fallbackServiceImage(index)} ${className}`}>
      <Sparkles className="h-8 w-8 text-pink-700/40" />
    </div>
  );
}

export default async function PublicShowcasePage({ params }: PublicShowcasePageProps) {
  const { slug } = await params;
  const data = await getPublicShowcase(slug);

  if (!data?.organization) notFound();

  const showcase = data.showcase ?? {
    hero_image_url: data.organization.cover_url,
    logo_url: data.organization.logo_url,
    title: data.organization.name,
    subtitle: "Realce sua beleza. Revele sua melhor versao.",
    description:
      data.organization.description ||
      "Especialistas em atendimento personalizado, resultados que encantam e uma experiencia simples para agendar.",
    whatsapp: data.organization.whatsapp,
    instagram_url: null,
    phone: data.organization.phone,
    address_text: [data.organization.address, data.organization.city, data.organization.state]
      .filter(Boolean)
      .join(", ")
  };

  const services = data.services as Service[];
  const featuredServices = services.slice(0, 4);
  const firstService = services[0];
  const heroImage = showcase.hero_image_url;
  const logoUrl = showcase.logo_url;
  const publicWhatsapp = whatsappUrl(showcase.whatsapp);
  const address = showcase.address_text || "Atendimento local ou online conforme disponibilidade.";

  return (
    <main className="min-h-screen bg-[#fff6fa] text-[#221018]">
      <div className="mx-auto grid max-w-[1240px] gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-8">
        <section className="space-y-6">
          <div className="overflow-hidden rounded-[2.2rem] border border-pink-100 bg-white/80 shadow-2xl shadow-pink-900/10">
            <div className="relative min-h-[620px] overflow-hidden bg-gradient-to-br from-white via-[#fff1f7] to-[#f9dce9] p-5 sm:p-8 lg:min-h-[520px]">
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroImage}
                  alt=""
                  className="absolute bottom-0 right-0 h-[74%] w-full object-cover object-center opacity-90 sm:h-full sm:w-[58%]"
                />
              ) : (
                <div className="absolute bottom-0 right-0 h-[76%] w-[70%] rounded-tl-[12rem] bg-gradient-to-br from-pink-200 via-rose-100 to-white opacity-90" />
              )}
              <div className="absolute inset-y-0 right-0 w-2/3 bg-gradient-to-r from-[#fff6fa] via-[#fff6fa]/45 to-transparent sm:hidden" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="" className="h-16 w-16 rounded-full border border-pink-100 object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-pink-100 bg-white font-serif text-2xl text-[#c01867]">
                      {initials(showcase.title)}
                    </div>
                  )}
                  <div>
                    <p className="font-serif text-3xl text-[#9b174f]">{showcase.title}</p>
                    <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#9b174f]/65">
                      Vitrine digital
                    </p>
                  </div>
                </div>
                <Link
                  href="#servicos"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-pink-100 bg-white/90 text-[#9b174f] shadow-sm"
                  aria-label="Ver menu"
                >
                  <Menu className="h-5 w-5" />
                </Link>
              </div>

              <div className="relative z-10 mt-12 max-w-md sm:mt-20">
                <div className="mb-6 inline-flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-3 text-sm font-bold text-[#9b174f] shadow-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  4,9 <span className="text-[#7e5a69]">(480 avaliacoes)</span>
                </div>
                <h1 className="font-serif text-5xl leading-[0.96] tracking-tight text-[#221018] sm:text-6xl">
                  {showcase.subtitle || "Realce sua beleza."}
                </h1>
                <p className="mt-6 max-w-sm text-sm leading-7 text-[#6f5360]">
                  {showcase.description}
                </p>
                <div className="mt-7 grid gap-3 sm:max-w-sm">
                  <a
                    href="#agendar"
                    className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-[#c01867] px-6 text-sm font-black text-white shadow-xl shadow-pink-900/20"
                  >
                    <CalendarDays className="h-5 w-5" />
                    Agendar agora
                  </a>
                  <a
                    href={publicWhatsapp}
                    className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-[#c01867]/25 bg-white/90 px-6 text-sm font-black text-[#9b174f]"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Falar no WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>

          <section id="servicos" className="rounded-[2rem] border border-pink-100 bg-white/85 p-5 shadow-xl shadow-pink-900/5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[#9b174f]">
                <Users className="h-5 w-5" />
                <h2 className="font-serif text-2xl text-[#221018]">Nossos servicos</h2>
              </div>
              <a href="#todos-servicos" className="hidden text-sm font-bold text-[#c01867] sm:inline-flex">
                Ver todos <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(featuredServices.length ? featuredServices : services).map((service, index) => (
                <article key={service.id} className="overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-lg shadow-pink-900/5">
                  <ServiceImage service={service} index={index} className="flex h-36 w-full items-center justify-center" />
                  <div className="p-4">
                    <h3 className="font-serif text-xl leading-tight">{service.name}</h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#7e5a69]">
                      {service.description || "Atendimento personalizado para voce."}
                    </p>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold text-[#7e5a69]">A partir de</p>
                        <p className="font-black text-[#c01867]">{formatCurrency(service.price_cents)}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-[#7e5a69]">
                        <Clock3 className="h-4 w-4" />
                        {service.duration_minutes} min
                      </div>
                    </div>
                    <a
                      href="#agendar"
                      className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#c01867] text-sm font-black text-white"
                    >
                      Agendar
                    </a>
                  </div>
                </article>
              ))}
              {services.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-pink-200 bg-white p-8 text-center text-sm text-[#7e5a69] sm:col-span-2 xl:col-span-4">
                  Servicos em configuracao.
                </div>
              ) : null}
            </div>
          </section>

          <section id="todos-servicos" className="grid gap-4 lg:hidden">
            {services.slice(4).map((service, index) => (
              <article key={service.id} className="grid grid-cols-[120px_1fr] overflow-hidden rounded-2xl border border-pink-100 bg-white">
                <ServiceImage service={service} index={index + 4} className="flex h-full min-h-32 items-center justify-center" />
                <div className="p-4">
                  <h3 className="font-serif text-xl">{service.name}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#7e5a69]">{service.description}</p>
                  <p className="mt-3 font-black text-[#c01867]">{formatCurrency(service.price_cents)}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.6rem] border border-pink-100 bg-white/85 p-5 shadow-lg shadow-pink-900/5">
              <p className="flex items-center gap-2 font-serif text-2xl">
                <Star className="h-5 w-5 fill-[#c01867] text-[#c01867]" />
                O que nossas clientes dizem
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
                {["Juliana M.", "Camila R.", "Larissa T."].map((name) => (
                  <div key={name} className="rounded-2xl border border-pink-100 bg-white p-4 text-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-9 w-9 rounded-full bg-pink-100" />
                      <strong>{name}</strong>
                    </div>
                    <p className="text-xs leading-5 text-[#7e5a69]">
                      Atendimento impecavel, ambiente acolhedor e resultado lindo. Recomendo muito.
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-pink-100 bg-white/85 p-5 shadow-lg shadow-pink-900/5">
              <div className="flex items-center justify-between">
                <p className="font-serif text-2xl">Nosso espaco</p>
                <MapPin className="h-5 w-5 text-[#c01867]" />
              </div>
              <p className="mt-3 text-sm leading-6 text-[#7e5a69]">{address}</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-pink-100 to-white" />
                ))}
              </div>
            </div>
          </section>
        </section>

        <aside id="agendar" className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[2rem] border border-pink-100 bg-white p-5 shadow-2xl shadow-pink-900/10 lg:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0f6] text-[#c01867]">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-serif text-3xl leading-none">Agende seu horario</h2>
                <p className="mt-2 text-xs text-[#7e5a69]">Escolha o servico, profissional e melhor horario para voce.</p>
              </div>
            </div>

            {firstService ? (
              <div className="mb-5 grid grid-cols-[84px_1fr] gap-3 rounded-2xl border border-pink-100 bg-[#fff8fb] p-3">
                <ServiceImage service={firstService} index={0} className="flex h-24 w-full items-center justify-center rounded-xl" />
                <div>
                  <h3 className="font-serif text-lg leading-tight">{firstService.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-[#7e5a69]">{firstService.description}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#7e5a69]">
                      <Clock3 className="h-4 w-4" />
                      {firstService.duration_minutes} min
                    </span>
                    <span className="font-black text-[#c01867]">{formatCurrency(firstService.price_cents)}</span>
                  </div>
                </div>
              </div>
            ) : null}

            <form action={requestAppointmentAction} className="grid gap-4">
              <input type="hidden" name="organizationId" value={data.organization.id} />
              <div className="space-y-2">
                <Label htmlFor="serviceId">Servico</Label>
                <select id="serviceId" name="serviceId" className="h-12 w-full rounded-xl border border-pink-100 bg-white px-3 text-sm text-[#221018]">
                  <option value="">Escolha um servico</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>{service.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="professionalId">Profissional</Label>
                <select id="professionalId" name="professionalId" className="h-12 w-full rounded-xl border border-pink-100 bg-white px-3 text-sm text-[#221018]">
                  <option value="">Qualquer profissional</option>
                  {data.professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>{professional.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input id="date" name="date" type="date" required className="h-12 rounded-xl border-pink-100" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horario</Label>
                  <Input id="time" name="time" type="time" required className="h-12 rounded-xl border-pink-100" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Input name="customerName" placeholder="Seu nome completo" required className="h-12 rounded-xl border-pink-100" />
                <Input name="customerPhone" placeholder="WhatsApp" required className="h-12 rounded-xl border-pink-100" />
              </div>
              <Input name="customerEmail" type="email" placeholder="seu@email.com" className="h-12 rounded-xl border-pink-100" />
              <textarea
                name="notes"
                placeholder="Conte rapidamente o que voce precisa"
                className="min-h-24 rounded-xl border border-pink-100 p-3 text-sm outline-none focus:border-[#c01867]"
              />
              <Button type="submit" className="h-14 rounded-xl bg-[#c01867] text-base font-black text-white hover:bg-[#a71355]">
                <CalendarDays className="mr-2 h-5 w-5" />
                Confirmar agendamento
              </Button>
              <p className="flex items-center justify-center gap-2 text-xs font-semibold text-[#7e5a69]">
                <Lock className="h-4 w-4" />
                Seus dados estao protegidos e seguros.
              </p>
            </form>
          </div>

          <section className="mt-5 rounded-[1.6rem] border border-pink-100 bg-white p-5 shadow-xl shadow-pink-900/5">
            <h2 className="font-serif text-2xl">Por que escolher?</h2>
            <div className="mt-4 grid gap-3 text-sm">
              {[
                ["Atendimento personalizado", Heart],
                ["Produtos e servicos premium", ShieldCheck],
                ["Profissionais especializados", Users],
                ["Ambiente acolhedor", Sparkles]
              ].map(([label, Icon]) => (
                <div key={String(label)} className="flex items-center gap-3 rounded-2xl bg-[#fff8fb] p-3">
                  <Icon className="h-5 w-5 text-[#c01867]" />
                  <span className="font-bold">{String(label)}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-pink-100 bg-white/95 px-3 pb-[env(safe-area-inset-bottom)] text-[11px] font-bold text-[#7e5a69] shadow-2xl backdrop-blur lg:hidden">
        <a href="#" className="flex min-h-16 flex-col items-center justify-center gap-1 text-[#c01867]">
          <Heart className="h-5 w-5" />
          Inicio
        </a>
        <a href="#servicos" className="flex min-h-16 flex-col items-center justify-center gap-1">
          <Sparkles className="h-5 w-5" />
          Servicos
        </a>
        <a href="#agendar" className="flex min-h-16 flex-col items-center justify-center gap-1">
          <CalendarDays className="h-5 w-5" />
          Agendar
        </a>
        <a href={publicWhatsapp} className="flex min-h-16 flex-col items-center justify-center gap-1">
          <Phone className="h-5 w-5" />
          Contato
        </a>
      </nav>

      <div className="fixed bottom-20 right-4 z-40 lg:hidden">
        <a
          href="#agendar"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#c01867] text-white shadow-2xl shadow-pink-900/30"
          aria-label="Agendar agora"
        >
          <CalendarDays className="h-6 w-6" />
        </a>
      </div>

      {showcase.instagram_url ? (
        <a
          href={showcase.instagram_url}
          target="_blank"
          rel="noreferrer"
          className="sr-only"
        >
          <Instagram className="h-4 w-4" />
          Instagram
        </a>
      ) : null}
    </main>
  );
}
