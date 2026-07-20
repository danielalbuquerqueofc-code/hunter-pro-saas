"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Grid3X3,
  Heart,
  Instagram,
  Link as LinkIcon,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Share2,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  X
} from "lucide-react";
import { requestAppointmentAction } from "@/features/appointments/actions";
import { getFontClass, resolveShowcaseTheme } from "@/features/showcase/theme";

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  timezone?: string | null;
  default_appointment_margin_minutes?: number | null;
  booking_min_notice_minutes?: number | null;
  booking_max_days_ahead?: number | null;
  booking_slot_interval_minutes?: number | null;
  booking_slot_mode?: "FIXED_GRID" | "SEQUENTIAL_BLOCKS" | null;
  booking_confirmation_mode?: "AUTOMATIC" | "MANUAL" | null;
};

type Showcase = {
  title: string;
  subtitle: string | null;
  description: string | null;
  hero_image_url: string | null;
  logo_url: string | null;
  primary_color?: string | null;
  whatsapp: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  tiktok_url?: string | null;
  youtube_url?: string | null;
  phone?: string | null;
  address_text?: string | null;
  theme_key?: string | null;
  font_key?: string | null;
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  duration_minutes: number;
  price_cents: number;
  is_online?: boolean | null;
  margin_before_minutes?: number | null;
  margin_after_minutes?: number | null;
  booking_min_notice_minutes?: number | null;
  booking_max_days_ahead?: number | null;
};

type Professional = {
  id: string;
  name: string;
  bio: string | null;
  appointment_margin_minutes?: number | null;
  booking_slot_interval_minutes?: number | null;
};

type ShowcaseLink = {
  id: string;
  label: string;
  url: string;
};

type GalleryItem = {
  id: string;
  image_url: string;
  alt_text: string | null;
};

type PublicStorefrontProps = {
  organization: Organization;
  showcase: Showcase;
  services: Service[];
  professionals: Professional[];
  links: ShowcaseLink[];
  gallery: GalleryItem[];
};

type ApiSlot = {
  time: string;
  startsAt: string;
  endsAt: string;
  occupiedStartsAt: string;
  occupiedEndsAt: string;
  professionalId: string;
  professionalName: string;
};

type StorefrontContext = {
  organization: Organization;
  showcase: Showcase;
  services: Service[];
  professionals: Professional[];
  links: ShowcaseLink[];
  gallery: GalleryItem[];
  logoUrl: string | null;
  heroPhoto: string | null | undefined;
  address: string;
  headline: string;
  description: string;
  whatsapp: string;
  phone: string | null | undefined;
  instagram: string;
  safeLinks: Array<ShowcaseLink & { url: string }>;
  hasContact: boolean;
  hasGallery: boolean;
  navItems: Array<{ label: string; href: string }>;
  trustHighlights: Array<{ title: string; description: string; icon: typeof ShieldCheck }>;
  openBooking: (serviceId?: string) => void;
  shareShowcase: () => Promise<void>;
};

function initials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase();
}

function formatCurrency(cents: number) {
  if (!cents) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function formatDuration(minutes: number | null | undefined) {
  return minutes ? `${minutes} min` : "Duracao a combinar";
}

function whatsappUrl(value: string | null | undefined, text?: string) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  const phone = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${phone}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

function safeExternalUrl(value: string | null | undefined) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    return "";
  }
  return "";
}

function isUsableImage(value: string | null | undefined) {
  if (!value) return false;
  return !value.includes("encrypted-tbn");
}

function fallbackHeadline(title: string, organizationDescription?: string | null) {
  const text = `${title} ${organizationDescription ?? ""}`.toLowerCase();
  if (/(beleza|sobrancelha|cilios|manicure|estetica|studio|salao|barbearia)/.test(text)) {
    return "Realce sua beleza, cuide de voce.";
  }
  if (/(consult|mentoria|servico|agenda|atendimento)/.test(text)) {
    return "Agende seu atendimento com facilidade.";
  }
  return "Seu momento de cuidado comeca aqui.";
}

function splitHeadline(headline: string) {
  const parts = headline.split(",");
  if (parts.length > 1) {
    return { main: `${parts[0]},`, highlight: parts.slice(1).join(",").trim() };
  }
  const words = headline.split(" ");
  if (words.length > 4) {
    return { main: words.slice(0, 4).join(" "), highlight: words.slice(4).join(" ") };
  }
  return { main: headline, highlight: "" };
}

function shortServiceDescription(service: Service) {
  return service.description || "Atendimento personalizado para o que voce precisa.";
}

function toDateInput(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function buildDates() {
  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return {
      value: toDateInput(date),
      label: index === 0 ? "Hoje" : date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      day: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    };
  });
}

function LogoMark({ logoUrl, title, compact = false }: { logoUrl: string | null; title: string; compact?: boolean }) {
  const size = compact ? "h-10 w-10" : "h-14 w-14";

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={`${title} logo`} className={`${size} shrink-0 rounded-full border border-white/50 bg-white object-cover shadow-sm`} />
    );
  }

  return (
    <span className={`${size} flex shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-[var(--store-primary)] shadow-sm`}>
      {initials(title)}
    </span>
  );
}

function ServiceMedia({ service, index, compact = false }: { service: Service; index: number; compact?: boolean }) {
  if (service.image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={service.image_url} alt="" loading={index > 1 ? "lazy" : "eager"} className="h-full w-full object-cover" />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--store-bg-soft)]">
      <div className={compact ? "rounded-2xl bg-white/80 p-3" : "rounded-[1.3rem] bg-white/85 p-4"}>
        <Sparkles className={compact ? "h-5 w-5 text-[var(--store-primary)]" : "h-8 w-8 text-[var(--store-primary)]"} />
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-14 rounded-2xl bg-[var(--store-primary)] px-5 text-base font-black text-[var(--store-primary-contrast)] shadow-lg transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Confirmando..." : "Confirmar agendamento"}
    </button>
  );
}

function BookingStepper({ step }: { step: number }) {
  const labels = ["Servico", "Profissional", "Data e hora", "Seus dados", "Resumo"];

  return (
    <div className="border-b border-[var(--store-border)] px-5 pb-4">
      <div className="grid grid-cols-5 gap-1.5" aria-label="Progresso do agendamento">
        {labels.map((label, index) => {
          const current = index + 1;
          return (
            <div key={label} className="min-w-0 text-center">
              <span className={`mx-auto block h-2 rounded-full ${current <= step ? "bg-[var(--store-primary)]" : "bg-slate-200"}`} />
              <span className={`mt-2 hidden truncate text-[10px] font-black sm:block ${current === step ? "text-[var(--store-primary)]" : "text-[var(--store-muted)]"}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BookingDialog({
  slug,
  open,
  onClose,
  organization,
  services,
  professionals,
  selectedServiceId,
  setSelectedServiceId,
  whatsapp
}: {
  slug: string;
  open: boolean;
  onClose: () => void;
  organization: Organization;
  services: Service[];
  professionals: Professional[];
  selectedServiceId: string;
  setSelectedServiceId: (value: string) => void;
  whatsapp: string;
}) {
  const dates = useMemo(() => buildDates(), []);
  const [step, setStep] = useState(1);
  const [professionalId, setProfessionalId] = useState("");
  const [date, setDate] = useState(dates[0]?.value ?? "");
  const [time, setTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<ApiSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [hold, setHold] = useState<{ holdId: string; sessionToken: string; expiresAt: string } | null>(null);
  const [holdError, setHoldError] = useState("");
  const selectedService = services.find((service) => service.id === selectedServiceId) ?? services[0];

  const loadSlots = useCallback(async (signal?: AbortSignal) => {
    if (!selectedService?.id || !date) return;
    const params = new URLSearchParams({ slug, serviceId: selectedService.id, date });
    if (professionalId) params.set("professionalId", professionalId);

    setSlotsLoading(true);
    setSlotsError("");

    try {
      const response = await fetch(`/api/public/availability?${params.toString()}`, { signal });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Nao foi possivel carregar horarios.");
      setSlots(payload.slots ?? []);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") setSlotsError(error.message);
    } finally {
      setSlotsLoading(false);
    }
  }, [date, professionalId, selectedService, slug]);

  useEffect(() => {
    if (!open || !selectedService?.id || !date || step < 3) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadSlots(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadSlots, date, open, selectedService?.id, step]);

  if (!open) return null;

  const selectedSlot = slots.find((slot) => slot.time === time);
  const resolvedProfessionalName =
    selectedSlot?.professionalName || professionals.find((professional) => professional.id === professionalId)?.name || "Qualquer profissional";
  const canGoNext =
    (step === 1 && Boolean(selectedService?.id)) ||
    step === 2 ||
    (step === 3 && Boolean(date && time)) ||
    (step === 4 && customerName.trim().length > 1 && customerPhone.replace(/\D/g, "").length >= 8);
  const summaryRows = [
    ["Empresa", organization.name],
    ["Servico", selectedService?.name ?? "A escolher"],
    ["Profissional", resolvedProfessionalName],
    ["Data", date ? new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR") : "A escolher"],
    ["Horario", time || "A escolher"],
    ["Duracao", formatDuration(selectedService?.duration_minutes)],
    ["Valor", formatCurrency(selectedService?.price_cents ?? 0)],
    ["Cliente", customerName || "Nao informado"],
    ["WhatsApp", customerPhone || "Nao informado"]
  ];

  async function nextStep() {
    if (step === 4) {
      setHoldError("");
      const slot = selectedSlot;
      if (!slot) {
        setHoldError("Esse horario acabou de ser reservado. Escolha uma das novas opcoes disponiveis.");
        setStep(3);
        return;
      }

      const response = await fetch("/api/public/holds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          serviceId: selectedService?.id,
          professionalId: slot.professionalId,
          date,
          time
        })
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        setHoldError(payload.error || "Esse horario acabou de ser reservado. Escolha uma das novas opcoes disponiveis.");
        setStep(3);
        return;
      }

      setProfessionalId(slot.professionalId);
      setHold({
        holdId: payload.hold_id,
        sessionToken: payload.session_token,
        expiresAt: payload.expires_at
      });
    }

    setStep((current) => Math.min(5, current + 1));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="max-h-[94vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:max-w-2xl sm:rounded-[2rem]">
        <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-slate-200 sm:hidden" />
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <button
            type="button"
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--store-border)] bg-white shadow-sm"
            aria-label={step > 1 ? "Voltar etapa" : "Fechar agendamento"}
          >
            {step > 1 ? <ArrowLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
          <div className="min-w-0 text-center">
            <h2 className="text-xl font-black text-[var(--store-text)]">Agendar</h2>
            <p className="text-xs font-bold text-[var(--store-muted)]">Escolha o horario ideal para voce.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--store-border)] bg-white shadow-sm"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <BookingStepper step={step} />

        <form action={requestAppointmentAction} className="max-h-[calc(94vh-126px)] overflow-y-auto px-5 pb-7 pt-5">
          <input type="hidden" name="organizationId" value={organization.id} />
          <input type="hidden" name="serviceId" value={selectedService?.id ?? ""} />
          <input type="hidden" name="professionalId" value={professionalId} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="time" value={time} />
          <input type="hidden" name="holdId" value={hold?.holdId ?? ""} />
          <input type="hidden" name="sessionToken" value={hold?.sessionToken ?? ""} />
          <input type="hidden" name="customerName" value={customerName} />
          <input type="hidden" name="customerPhone" value={customerPhone} />
          <input type="hidden" name="customerEmail" value={customerEmail} />
          <input type="hidden" name="notes" value={notes} />

          {step === 1 ? (
            <div className="space-y-4">
              <div className="grid gap-3">
                {services.map((service, index) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      setSelectedServiceId(service.id);
                      setTime("");
                      setHold(null);
                    }}
                    className={`grid grid-cols-[92px_1fr] gap-3 rounded-[1.2rem] border p-2 text-left transition ${
                      selectedService?.id === service.id ? "border-[var(--store-primary)] bg-[var(--store-bg-soft)]" : "border-[var(--store-border)] bg-white"
                    }`}
                  >
                    <span className="h-24 overflow-hidden rounded-2xl bg-[var(--store-bg-soft)]">
                      <ServiceMedia service={service} index={index} compact />
                    </span>
                    <span className="min-w-0 py-1">
                      <span className="line-clamp-2 text-base font-black">{service.name}</span>
                      <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[var(--store-muted)]">{shortServiceDescription(service)}</span>
                      <span className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                        <span className="rounded-full bg-white px-3 py-1.5">{formatDuration(service.duration_minutes)}</span>
                        <span className="rounded-full bg-white px-3 py-1.5 text-[var(--store-primary)]">{formatCurrency(service.price_cents)}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setProfessionalId("");
                  setTime("");
                  setHold(null);
                }}
                className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left ${
                  !professionalId ? "border-[var(--store-primary)] bg-[var(--store-bg-soft)]" : "border-[var(--store-border)] bg-white"
                }`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--store-primary)]">
                  <UserRound className="h-6 w-6" />
                </span>
                <span>
                  <span className="block font-black">Qualquer profissional</span>
                  <span className="text-sm text-[var(--store-muted)]">O sistema escolhe uma agenda disponivel.</span>
                </span>
              </button>
              {professionals.map((professional) => (
                <button
                  key={professional.id}
                  type="button"
                  onClick={() => {
                    setProfessionalId(professional.id);
                    setTime("");
                    setHold(null);
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left ${
                    professionalId === professional.id ? "border-[var(--store-primary)] bg-[var(--store-bg-soft)]" : "border-[var(--store-border)] bg-white"
                  }`}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--store-bg-soft)] font-black text-[var(--store-primary)]">
                    {initials(professional.name)}
                  </span>
                  <span>
                    <span className="block font-black">{professional.name}</span>
                    {professional.bio ? <span className="line-clamp-1 text-sm text-[var(--store-muted)]">{professional.bio}</span> : null}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-black text-[var(--store-text)]">Data</p>
                <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {dates.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setDate(item.value);
                        setTime("");
                        setHold(null);
                      }}
                      className={`rounded-2xl border px-2 py-3 text-center transition ${
                        date === item.value
                          ? "border-[var(--store-primary)] bg-[var(--store-primary)] text-[var(--store-primary-contrast)]"
                          : "border-[var(--store-border)] bg-white text-[var(--store-text)]"
                      }`}
                    >
                      <span className="block text-[11px] font-black uppercase">{item.label}</span>
                      <span className="mt-1 block text-sm font-black">{item.day}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-black text-[var(--store-text)]">Horarios disponiveis</p>
                {slotsLoading ? (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5" aria-label="Carregando horarios">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <span key={index} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
                    ))}
                  </div>
                ) : null}
                {!slotsLoading && slotsError ? (
                  <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{slotsError}</div>
                ) : null}
                {!slotsLoading && !slotsError ? (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {slots.map((slot) => (
                      <button
                        key={`${slot.time}-${slot.professionalId}`}
                        type="button"
                        onClick={() => {
                          setTime(slot.time);
                          setHold(null);
                        }}
                        className={`min-h-12 rounded-2xl border text-sm font-black transition ${
                          time === slot.time
                            ? "border-[var(--store-primary)] bg-[var(--store-primary)] text-[var(--store-primary-contrast)]"
                            : "border-[var(--store-border)] bg-white text-[var(--store-text)]"
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                ) : null}
                {!slotsLoading && !slotsError && slots.length === 0 ? (
                  <div className="mt-3 rounded-2xl border border-dashed border-[var(--store-border)] bg-[var(--store-bg)] p-4 text-sm text-[var(--store-muted)]">
                    Nenhum horario livre para esta data. Escolha outro dia ou fale pelo WhatsApp.
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <label className="block text-sm font-black text-[var(--store-text)]">
                Seu nome
                <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="mt-2 h-14 w-full rounded-2xl border border-[var(--store-border)] px-4 text-sm outline-none focus:border-[var(--store-primary)]" placeholder="Digite seu nome completo" />
              </label>
              <label className="block text-sm font-black text-[var(--store-text)]">
                WhatsApp
                <input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} inputMode="tel" className="mt-2 h-14 w-full rounded-2xl border border-[var(--store-border)] px-4 text-sm outline-none focus:border-[var(--store-primary)]" placeholder="(00) 00000-0000" />
              </label>
              <label className="block text-sm font-black text-[var(--store-text)]">
                E-mail
                <input value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} type="email" className="mt-2 h-14 w-full rounded-2xl border border-[var(--store-border)] px-4 text-sm outline-none focus:border-[var(--store-primary)]" placeholder="seu@email.com" />
              </label>
              <label className="block text-sm font-black text-[var(--store-text)]">
                Observacoes
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 min-h-28 w-full rounded-2xl border border-[var(--store-border)] px-4 py-3 text-sm outline-none focus:border-[var(--store-primary)]" placeholder="Conte rapidamente o que voce precisa" />
              </label>
              <label className="flex items-start gap-3 rounded-2xl border border-[var(--store-border)] bg-[var(--store-bg)] p-4 text-sm leading-5 text-[var(--store-muted)]">
                <input name="consentWhatsapp" type="checkbox" defaultChecked className="mt-1" />
                <span>Autorizo o uso do WhatsApp informado para receber confirmacao e lembretes deste agendamento. Isso nao autoriza campanhas promocionais.</span>
              </label>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-5">
              <div className="rounded-[1.6rem] border border-[var(--store-border)] bg-[var(--store-bg)] p-4">
                <div className="mb-4 flex items-center gap-3">
                  <CheckCircle2 className="h-7 w-7 text-[var(--store-success)]" />
                  <div>
                    <p className="text-lg font-black text-[var(--store-text)]">Confira seu agendamento</p>
                    <p className="text-sm text-[var(--store-muted)]">O horario sera validado novamente ao confirmar.</p>
                  </div>
                </div>
                <dl className="grid gap-3">
                  {summaryRows.map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 rounded-2xl bg-white px-4 py-3 text-sm">
                      <dt className="font-bold text-[var(--store-muted)]">{label}</dt>
                      <dd className="text-right font-black text-[var(--store-text)]">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              {hold ? (
                <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                  Horario reservado temporariamente ate {new Date(hold.expiresAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.
                </p>
              ) : null}
              {holdError ? <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{holdError}</p> : null}
              {whatsapp ? (
                <a href={whatsapp} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--store-border)] font-black text-[var(--store-text)]">
                  <MessageCircle className="h-5 w-5" />
                  Tirar duvida no WhatsApp
                </a>
              ) : null}
            </div>
          ) : null}

          <div className="sticky bottom-0 mt-6 grid gap-3 bg-white pt-4">
            {step < 5 ? (
              <button type="button" disabled={!canGoNext} onClick={nextStep} className="min-h-14 rounded-2xl bg-[var(--store-primary)] px-5 text-base font-black text-[var(--store-primary-contrast)] shadow-lg transition disabled:cursor-not-allowed disabled:opacity-40">
                Continuar
              </button>
            ) : (
              <SubmitButton />
            )}
            <button type="button" onClick={onClose} className="min-h-12 rounded-2xl font-bold text-[var(--store-muted)]">
              Voltar para a vitrine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PublicStorefrontHeader({ context, menuOpen, setMenuOpen }: { context: StorefrontContext; menuOpen: boolean; setMenuOpen: (value: boolean) => void }) {
  const { showcase, logoUrl, whatsapp, navItems, openBooking, shareShowcase } = context;

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/10 bg-slate-950/30 text-white backdrop-blur-xl lg:absolute">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 lg:px-8">
        <a href="#inicio" className="flex min-w-0 items-center gap-3">
          <LogoMark logoUrl={logoUrl} title={showcase.title} compact />
          <span className="hidden min-w-0 sm:block">
            <strong className="block truncate text-sm font-black">{showcase.title}</strong>
          </span>
        </a>
        <nav className="hidden items-center gap-1 text-xs font-bold lg:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="rounded-full px-4 py-2 text-white/85 hover:bg-white/10 hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {whatsapp ? (
            <a href={whatsapp} target="_blank" rel="noreferrer" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-950 lg:hidden" aria-label="Abrir WhatsApp">
              <MessageCircle className="h-5 w-5" />
            </a>
          ) : null}
          <button type="button" onClick={shareShowcase} className="hidden h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white ring-1 ring-white/20 lg:flex" aria-label="Compartilhar vitrine">
            <Share2 className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => openBooking()} className="hidden h-11 rounded-full bg-[var(--store-primary)] px-5 text-sm font-black text-[var(--store-primary-contrast)] shadow-lg lg:inline-flex lg:items-center">
            Agendar agora
          </button>
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-950 lg:hidden" aria-label="Abrir menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {menuOpen ? (
        <div className="border-t border-white/10 bg-white p-5 text-slate-950 shadow-2xl lg:hidden">
          <div className="grid gap-2">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 font-black hover:bg-[var(--store-bg)]">
                {item.label}
              </a>
            ))}
            <button type="button" onClick={() => openBooking()} className="mt-2 min-h-12 rounded-2xl bg-[var(--store-primary)] px-4 font-black text-[var(--store-primary-contrast)]">
              Agendar agora
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function PublicStorefrontHero({ context }: { context: StorefrontContext }) {
  const { showcase, logoUrl, heroPhoto, headline, description, address, whatsapp, openBooking } = context;
  const title = splitHeadline(headline);

  return (
    <section id="inicio" className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0">
        {heroPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroPhoto} alt="" className="h-full w-full object-cover object-center" fetchPriority="high" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
            <Store className="h-24 w-24 text-white/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/78 to-slate-950/12" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/50 lg:hidden" />
      </div>
      <div className="relative mx-auto grid min-h-[720px] max-w-7xl items-end px-5 pb-28 pt-28 lg:min-h-[680px] lg:px-8 lg:pb-32 lg:pt-32">
        <div className="max-w-2xl">
          <div className="mb-5 flex items-center gap-3">
            <LogoMark logoUrl={logoUrl} title={showcase.title} />
            <div>
              <p className="text-lg font-black">{showcase.title}</p>
              <p className="text-sm font-bold text-white/70">Vitrine digital</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20">
            <ShieldCheck className="h-4 w-4 text-[var(--store-primary)]" />
            Atendimento verificado
          </span>
          <h1 className="mt-5 max-w-3xl text-[2.65rem] font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            {title.main} {title.highlight ? <span className="text-[var(--store-primary)]">{title.highlight}</span> : null}
          </h1>
          <p className="mt-5 max-w-xl text-base font-medium leading-7 text-white/82 sm:text-lg">{description}</p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold text-white/82">
            {address ? (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--store-primary)]" />
                {address}
              </span>
            ) : null}
          </div>
          <div className="mt-8 grid gap-3 sm:max-w-lg sm:grid-cols-2">
            <button type="button" onClick={() => openBooking()} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[var(--store-primary)] px-6 text-base font-black text-[var(--store-primary-contrast)] shadow-xl">
              <CalendarDays className="h-5 w-5" />
              Agendar agora
            </button>
            {whatsapp ? (
              <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-base font-black text-slate-950 shadow-xl">
                <MessageCircle className="h-5 w-5" />
                Falar no WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustHighlights({ items }: { items: StorefrontContext["trustHighlights"] }) {
  if (!items.length) return null;

  return (
    <section className="relative z-10 mx-auto -mt-16 max-w-6xl px-5 lg:-mt-14">
      <div className="grid gap-3 rounded-[1.6rem] border border-[var(--store-border)] bg-white p-3 shadow-[0_18px_60px_rgba(15,23,42,0.14)] sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="flex items-center gap-3 rounded-2xl px-3 py-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--store-bg-soft)] text-[var(--store-primary)]">
              <item.icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-black">{item.title}</span>
              <span className="block text-xs font-bold leading-4 text-[var(--store-muted)]">{item.description}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ServiceCard({ service, index, openBooking }: { service: Service; index: number; openBooking: (serviceId?: string) => void }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-[var(--store-border)] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--store-bg-soft)]">
        <ServiceMedia service={service} index={index} />
        {index === 0 ? (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--store-primary)] px-3 py-1 text-[11px] font-black text-[var(--store-primary-contrast)]">
            Destaque
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-lg font-black leading-tight">{service.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--store-muted)]">{shortServiceDescription(service)}</p>
        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 font-bold text-[var(--store-muted)]">
            <Clock className="h-4 w-4 text-[var(--store-primary)]" />
            {formatDuration(service.duration_minutes)}
          </span>
          <strong className="text-[var(--store-primary)]">{formatCurrency(service.price_cents)}</strong>
        </div>
        <button type="button" onClick={() => openBooking(service.id)} className="mt-5 min-h-12 rounded-xl bg-[var(--store-primary)] px-4 text-sm font-black text-[var(--store-primary-contrast)]">
          Agendar
        </button>
      </div>
    </article>
  );
}

function ServicesSection({ context }: { context: StorefrontContext }) {
  const { services, whatsapp, openBooking } = context;

  return (
    <section id="servicos" className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--store-primary)]">Nossos servicos</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Escolha o servico ideal</h2>
        </div>
        {services.length > 4 ? <a href="#servicos" className="hidden text-sm font-black text-[var(--store-primary)] sm:inline-flex">Ver todos os servicos</a> : null}
      </div>
      {services.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} openBooking={openBooking} />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.7rem] border border-dashed border-[var(--store-border)] bg-white p-8 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-[var(--store-primary)]" />
          <h3 className="text-xl font-black">Atendimentos sob consulta</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--store-muted)]">Fale com a equipe para consultar servicos e horarios.</p>
          {whatsapp ? <a href={whatsapp} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[var(--store-primary)] px-5 font-black text-[var(--store-primary-contrast)]">Falar no WhatsApp</a> : null}
        </div>
      )}
    </section>
  );
}

function GallerySection({ gallery, setPreviewImage }: { gallery: GalleryItem[]; setPreviewImage: (item: GalleryItem) => void }) {
  if (!gallery.length) return null;

  return (
    <section id="galeria" className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--store-primary)]">Nosso espaco</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Conheca mais de perto</h2>
        </div>
      </div>
      <div className="flex snap-x gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:overflow-visible">
        {gallery.slice(0, 8).map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPreviewImage(item)}
            className={`min-w-[72%] snap-center overflow-hidden rounded-[1.4rem] bg-[var(--store-bg-soft)] md:min-w-0 ${index === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
            aria-label={`Ampliar imagem ${item.alt_text || index + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image_url} alt={item.alt_text ?? ""} loading="lazy" className="aspect-[4/3] h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </section>
  );
}

function FinalCallToAction({ context }: { context: StorefrontContext }) {
  const { headline, whatsapp, openBooking } = context;

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <div className="overflow-hidden rounded-[1.6rem] bg-[var(--store-primary)] p-6 text-[var(--store-primary-contrast)] shadow-[var(--store-shadow)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-2xl font-black sm:text-3xl">Pronto para reservar seu horario?</p>
            <p className="mt-2 max-w-2xl text-sm font-medium opacity-90">{headline}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => openBooking()} className="min-h-12 rounded-2xl bg-white px-5 font-black text-slate-950">
              Agendar agora
            </button>
            {whatsapp ? <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/40 px-5 font-black">Falar no WhatsApp</a> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function PublicStorefrontFooter({ context }: { context: StorefrontContext }) {
  const { showcase, logoUrl, description, address, organization, whatsapp, phone, instagram, safeLinks } = context;
  const contactLinks = [
    whatsapp ? { label: "WhatsApp", url: whatsapp, icon: MessageCircle } : null,
    phone ? { label: "Telefone", url: `tel:${phone.replace(/\s/g, "")}`, icon: Phone } : null,
    instagram ? { label: "Instagram", url: instagram, icon: Instagram } : null
  ].filter(Boolean) as { label: string; url: string; icon: typeof Phone }[];

  return (
    <footer id="contato" className="mx-auto max-w-7xl px-5 pb-28 pt-10 lg:px-8 lg:pb-8">
      <div className="grid gap-8 border-t border-[var(--store-border)] pt-8 lg:grid-cols-[1.1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <LogoMark logoUrl={logoUrl} title={showcase.title} compact />
            <strong className="text-lg font-black">{showcase.title}</strong>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--store-muted)]">{description}</p>
          <p className="mt-5 text-xs font-bold text-[var(--store-muted)]">Desenvolvido por Hunter Pro.</p>
        </div>
        <div>
          <p className="font-black">Contato</p>
          <div className="mt-4 grid gap-3">
            {contactLinks.map((link) => (
              <a key={link.label} href={link.url} target={link.url.startsWith("http") ? "_blank" : undefined} rel={link.url.startsWith("http") ? "noreferrer" : undefined} className="flex items-center gap-2 text-sm font-bold text-[var(--store-muted)]">
                <link.icon className="h-4 w-4 text-[var(--store-primary)]" />
                {link.label}
              </a>
            ))}
            {organization.email ? <a href={`mailto:${organization.email}`} className="text-sm font-bold text-[var(--store-muted)]">{organization.email}</a> : null}
          </div>
        </div>
        <div>
          <p className="font-black">Endereco e links</p>
          {address ? <p className="mt-4 text-sm leading-6 text-[var(--store-muted)]">{address}</p> : null}
          <div className="mt-4 grid gap-2">
            {safeLinks.map((link) => (
              <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--store-primary)]">
                <LinkIcon className="h-4 w-4" />
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-8 border-t border-[var(--store-border)] pt-4 text-xs font-bold text-[var(--store-muted)]">
        © {new Date().getFullYear()} {showcase.title}. Todos os direitos reservados.
      </div>
    </footer>
  );
}

function MobileBottomNavigation({ context }: { context: StorefrontContext }) {
  const { hasGallery, openBooking } = context;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-[var(--store-border)] bg-white/96 px-2 pb-[env(safe-area-inset-bottom)] text-[10px] font-black text-[var(--store-muted)] shadow-[0_-14px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden">
      <a href="#inicio" className="flex min-h-16 flex-col items-center justify-center gap-1 text-[var(--store-primary)]">
        <Store className="h-5 w-5" />
        Inicio
      </a>
      <a href="#servicos" className="flex min-h-16 flex-col items-center justify-center gap-1">
        <Grid3X3 className="h-5 w-5" />
        Servicos
      </a>
      <button type="button" onClick={() => openBooking()} className="-mt-5 flex min-h-20 flex-col items-center justify-center gap-1 text-[var(--store-primary)]">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--store-primary)] text-[var(--store-primary-contrast)] shadow-lg">
          <CalendarDays className="h-6 w-6" />
        </span>
        Agendar
      </button>
      <a href={hasGallery ? "#galeria" : "#servicos"} className="flex min-h-16 flex-col items-center justify-center gap-1">
        <Heart className="h-5 w-5" />
        {hasGallery ? "Galeria" : "Fotos"}
      </a>
      <a href="#contato" className="flex min-h-16 flex-col items-center justify-center gap-1">
        <Phone className="h-5 w-5" />
        Contato
      </a>
    </nav>
  );
}

export function PublicStorefront({
  organization,
  showcase,
  services,
  professionals,
  links,
  gallery
}: PublicStorefrontProps) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id ?? "");
  const [previewImage, setPreviewImage] = useState<GalleryItem | null>(null);
  const style = resolveShowcaseTheme(showcase);
  const fontClass = getFontClass(showcase.font_key);
  const logoUrl = showcase.logo_url || organization.logo_url;
  const firstServiceImage = services.find((service) => service.image_url)?.image_url;
  const configuredHeroImage = isUsableImage(showcase.hero_image_url) ? showcase.hero_image_url : null;
  const configuredCoverImage = isUsableImage(organization.cover_url) ? organization.cover_url : null;
  const heroPhoto = configuredHeroImage || configuredCoverImage || firstServiceImage;
  const address = showcase.address_text || [organization.address, organization.city, organization.state].filter(Boolean).join(", ");
  const headline = showcase.subtitle || fallbackHeadline(showcase.title, organization.description);
  const description = showcase.description || organization.description || "Escolha um servico, veja horarios disponiveis e agende em poucos toques.";
  const whatsapp = whatsappUrl(showcase.whatsapp || organization.whatsapp, `Ola! Quero agendar pela vitrine ${showcase.title}.`);
  const phone = showcase.phone || organization.phone;
  const instagram = safeExternalUrl(showcase.instagram_url);
  const safeLinks = links.map((link) => ({ ...link, url: safeExternalUrl(link.url) })).filter((link) => link.url);
  const hasGallery = gallery.length > 0;
  const hasContact = Boolean(whatsapp || phone || instagram || address || safeLinks.length || organization.email);
  const navItems = [
    { label: "Inicio", href: "#inicio" },
    services.length ? { label: "Servicos", href: "#servicos" } : null,
    hasGallery ? { label: "Galeria", href: "#galeria" } : null,
    hasContact ? { label: "Contato", href: "#contato" } : null
  ].filter(Boolean) as Array<{ label: string; href: string }>;
  const trustHighlights = [
    services.length ? { title: "Agendamento facil", description: "Escolha servico e horario online.", icon: CalendarDays } : null,
    professionals.length ? { title: "Equipe cadastrada", description: "Profissionais disponiveis na agenda.", icon: UserRound } : null,
    whatsapp ? { title: "Contato direto", description: "Canal rapido para tirar duvidas.", icon: MessageCircle } : null,
    address ? { title: "Atendimento local", description: "Endereco informado pela empresa.", icon: MapPin } : null
  ].filter(Boolean) as StorefrontContext["trustHighlights"];

  function openBooking(serviceId?: string) {
    if (serviceId) setSelectedServiceId(serviceId);
    setMenuOpen(false);
    setBookingOpen(true);
  }

  async function shareShowcase() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: showcase.title, text: headline, url });
      return;
    }
    await navigator.clipboard.writeText(url);
  }

  const context: StorefrontContext = {
    organization,
    showcase,
    services,
    professionals,
    links,
    gallery,
    logoUrl,
    heroPhoto,
    address,
    headline,
    description,
    whatsapp,
    phone,
    instagram,
    safeLinks,
    hasContact,
    hasGallery,
    navItems,
    trustHighlights,
    openBooking,
    shareShowcase
  };

  return (
    <main style={style} className={`${fontClass} min-h-screen bg-[var(--store-bg)] text-[var(--store-text)]`}>
      <PublicStorefrontHeader context={context} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <PublicStorefrontHero context={context} />
      <TrustHighlights items={trustHighlights} />
      <ServicesSection context={context} />
      <GallerySection gallery={gallery} setPreviewImage={setPreviewImage} />
      <FinalCallToAction context={context} />
      <PublicStorefrontFooter context={context} />
      <MobileBottomNavigation context={context} />

      <BookingDialog
        slug={organization.slug}
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        organization={organization}
        services={services}
        professionals={professionals}
        selectedServiceId={selectedServiceId}
        setSelectedServiceId={setSelectedServiceId}
        whatsapp={whatsapp}
      />

      {previewImage ? (
        <button type="button" onClick={() => setPreviewImage(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4" aria-label="Fechar imagem">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewImage.image_url} alt={previewImage.alt_text ?? ""} className="max-h-full max-w-full rounded-3xl object-contain" />
        </button>
      ) : null}
    </main>
  );
}
