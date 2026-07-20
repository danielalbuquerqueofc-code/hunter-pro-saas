"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  ImageIcon,
  Instagram,
  Link as LinkIcon,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Users,
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

function ServiceMedia({ service, index, compact = false }: { service: Service; index: number; compact?: boolean }) {
  if (service.image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={service.image_url}
        alt=""
        loading={index > 1 ? "lazy" : "eager"}
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--store-bg-soft)]">
      <div className={compact ? "rounded-2xl bg-white/80 p-3" : "rounded-[1.3rem] bg-white/80 p-4"}>
        <Sparkles className={compact ? "h-5 w-5 text-[var(--store-primary)]" : "h-8 w-8 text-[var(--store-primary)]"} />
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
    if (!open || !selectedService?.id || !date) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadSlots(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadSlots, date, open, selectedService?.id]);

  if (!open) return null;

  const canGoNext =
    (step === 1 && Boolean(selectedServiceId || selectedService)) ||
    (step === 2 && Boolean(date && time)) ||
    (step === 3 && customerName.trim().length > 1 && customerPhone.replace(/\D/g, "").length >= 8);

  const selectedSlot = slots.find((slot) => slot.time === time);
  const resolvedProfessionalName =
    selectedSlot?.professionalName || professionals.find((professional) => professional.id === professionalId)?.name || "Qualquer profissional";

  const summaryRows = [
    ["Servico", selectedService?.name ?? "A escolher"],
    ["Profissional", resolvedProfessionalName],
    ["Data", date ? new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR") : "A escolher"],
    ["Horario", time || "A escolher"],
    ["Cliente", customerName || "Nao informado"]
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="max-h-[92vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:max-w-2xl sm:rounded-[2rem]">
        <div className="flex items-center justify-between border-b border-[var(--store-border)] px-5 py-4">
          <button
            type="button"
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--store-border)]"
            aria-label={step > 1 ? "Voltar etapa" : "Fechar agendamento"}
          >
            {step > 1 ? <ArrowLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--store-primary)]">Etapa {step} de 4</p>
            <h2 className="text-lg font-black text-[var(--store-text)]">Agende seu horario</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--store-border)]"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 px-5 pt-4" aria-label="Progresso do agendamento">
          {[1, 2, 3, 4].map((item) => (
            <span
              key={item}
              className={`h-2 rounded-full ${item <= step ? "bg-[var(--store-primary)]" : "bg-slate-200"}`}
            />
          ))}
        </div>

        <form action={requestAppointmentAction} className="max-h-[calc(92vh-112px)] overflow-y-auto px-5 py-5">
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
            <div className="space-y-5">
              <div>
                <label htmlFor="booking-service" className="text-sm font-black text-[var(--store-text)]">
                  Escolha o servico
                </label>
                <select
                  id="booking-service"
                  value={selectedService?.id ?? ""}
                  onChange={(event) => {
                    setSelectedServiceId(event.target.value);
                    setTime("");
                    setHold(null);
                  }}
                  className="mt-2 h-14 w-full rounded-2xl border border-[var(--store-border)] bg-white px-4 text-sm font-bold text-[var(--store-text)] outline-none focus:border-[var(--store-primary)]"
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rounded-[1.5rem] border border-[var(--store-border)] bg-[var(--store-bg)] p-4">
                <p className="text-lg font-black">{selectedService?.name ?? "Servico"}</p>
                <p className="mt-1 text-sm leading-6 text-[var(--store-muted)]">
                  {selectedService?.description || "Servico personalizado conforme sua necessidade."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold text-[var(--store-text)]">
                  <span className="rounded-full bg-white px-3 py-2">{formatDuration(selectedService?.duration_minutes)}</span>
                  <span className="rounded-full bg-white px-3 py-2">{formatCurrency(selectedService?.price_cents ?? 0)}</span>
                </div>
              </div>
              <div>
                <label htmlFor="booking-professional" className="text-sm font-black text-[var(--store-text)]">
                  Profissional
                </label>
                <select
                  id="booking-professional"
                  value={professionalId}
                  onChange={(event) => {
                    setProfessionalId(event.target.value);
                    setTime("");
                    setHold(null);
                  }}
                  className="mt-2 h-14 w-full rounded-2xl border border-[var(--store-border)] bg-white px-4 text-sm font-bold text-[var(--store-text)] outline-none focus:border-[var(--store-primary)]"
                >
                  <option value="">Qualquer profissional</option>
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
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
                  <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                    {slotsError}
                  </div>
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

          {step === 3 ? (
            <div className="space-y-4">
              <label className="block text-sm font-black text-[var(--store-text)]">
                Seu nome
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  className="mt-2 h-14 w-full rounded-2xl border border-[var(--store-border)] px-4 text-sm outline-none focus:border-[var(--store-primary)]"
                  placeholder="Digite seu nome completo"
                />
              </label>
              <label className="block text-sm font-black text-[var(--store-text)]">
                WhatsApp
                <input
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  inputMode="tel"
                  className="mt-2 h-14 w-full rounded-2xl border border-[var(--store-border)] px-4 text-sm outline-none focus:border-[var(--store-primary)]"
                  placeholder="(00) 00000-0000"
                />
              </label>
              <label className="block text-sm font-black text-[var(--store-text)]">
                E-mail
                <input
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  type="email"
                  className="mt-2 h-14 w-full rounded-2xl border border-[var(--store-border)] px-4 text-sm outline-none focus:border-[var(--store-primary)]"
                  placeholder="seu@email.com"
                />
              </label>
              <label className="block text-sm font-black text-[var(--store-text)]">
                Observacoes
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="mt-2 min-h-28 w-full rounded-2xl border border-[var(--store-border)] px-4 py-3 text-sm outline-none focus:border-[var(--store-primary)]"
                  placeholder="Conte rapidamente o que voce precisa"
                />
              </label>
              <label className="flex items-start gap-3 rounded-2xl border border-[var(--store-border)] bg-[var(--store-bg)] p-4 text-sm leading-5 text-[var(--store-muted)]">
                <input name="consentWhatsapp" type="checkbox" defaultChecked className="mt-1" />
                <span>
                  Autorizo o uso do WhatsApp informado para receber confirmacao e lembretes deste agendamento. Isso nao autoriza campanhas promocionais.
                </span>
              </label>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-5">
              <div className="rounded-[1.6rem] border border-[var(--store-border)] bg-[var(--store-bg)] p-4">
                <div className="mb-4 flex items-center gap-3">
                  <CheckCircle2 className="h-7 w-7 text-[var(--store-success)]" />
                  <div>
                    <p className="text-lg font-black text-[var(--store-text)]">Confira seu agendamento</p>
                    <p className="text-sm text-[var(--store-muted)]">Depois de confirmar, sua solicitacao sera enviada.</p>
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
                  Horario reservado temporariamente ate{" "}
                  {new Date(hold.expiresAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.
                </p>
              ) : null}
              {holdError ? (
                <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{holdError}</p>
              ) : null}
              {whatsapp ? (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--store-border)] font-black text-[var(--store-text)]"
                >
                  <MessageCircle className="h-5 w-5" />
                  Tirar duvida no WhatsApp
                </a>
              ) : null}
            </div>
          ) : null}

          <div className="sticky bottom-0 mt-6 grid gap-3 bg-white pt-4">
            {step < 4 ? (
              <button
                type="button"
                disabled={!canGoNext}
                onClick={async () => {
                  if (step === 3) {
                    setHoldError("");
                    const slot = selectedSlot;
                    if (!slot) {
                      setHoldError("Escolha novamente um horario disponivel.");
                      setStep(2);
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
                      setHoldError(payload.error || "Esse horario nao esta mais disponivel.");
                      setStep(2);
                      return;
                    }

                    setProfessionalId(slot.professionalId);
                    setHold({
                      holdId: payload.hold_id,
                      sessionToken: payload.session_token,
                      expiresAt: payload.expires_at
                    });
                  }
                  setStep((current) => Math.min(4, current + 1));
                }}
                className="min-h-14 rounded-2xl bg-[var(--store-primary)] px-5 text-base font-black text-[var(--store-primary-contrast)] shadow-lg transition disabled:cursor-not-allowed disabled:opacity-40"
              >
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

export function PublicStorefront({
  organization,
  showcase,
  services,
  professionals,
  links,
  gallery
}: PublicStorefrontProps) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id ?? "");
  const [previewImage, setPreviewImage] = useState<GalleryItem | null>(null);
  const style = resolveShowcaseTheme(showcase);
  const fontClass = getFontClass(showcase.font_key);
  const heroImage = showcase.hero_image_url || organization.cover_url;
  const logoUrl = showcase.logo_url || organization.logo_url;
  const address =
    showcase.address_text || [organization.address, organization.city, organization.state].filter(Boolean).join(", ");
  const whatsapp = whatsappUrl(showcase.whatsapp || organization.whatsapp, `Ola! Quero agendar pela vitrine ${showcase.title}.`);
  const phone = showcase.phone || organization.phone;
  const instagram = safeExternalUrl(showcase.instagram_url);
  const primaryLinks = [
    instagram ? { label: "Instagram", url: instagram, icon: Instagram } : null,
    whatsapp ? { label: "WhatsApp", url: whatsapp, icon: MessageCircle } : null,
    phone ? { label: "Ligar", url: `tel:${phone.replace(/\s/g, "")}`, icon: Phone } : null
  ].filter(Boolean) as { label: string; url: string; icon: typeof Instagram }[];

  function openBooking(serviceId?: string) {
    if (serviceId) setSelectedServiceId(serviceId);
    setBookingOpen(true);
  }

  async function shareShowcase() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: showcase.title, text: showcase.subtitle ?? showcase.title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
  }

  return (
    <main style={style} className={`${fontClass} min-h-screen bg-[var(--store-bg)] text-[var(--store-text)]`}>
      <header className="sticky top-0 z-40 border-b border-[var(--store-border)] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <a href="#inicio" className="flex min-w-0 items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-12 w-12 rounded-2xl object-cover ring-1 ring-[var(--store-border)]" />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--store-bg-soft)] text-lg font-black text-[var(--store-primary)]">
                {initials(showcase.title)}
              </span>
            )}
            <span className="min-w-0">
              <strong className="block truncate text-base font-black">{showcase.title}</strong>
              <span className="block truncate text-xs font-bold text-[var(--store-muted)]">Vitrine digital</span>
            </span>
          </a>
          <nav className="hidden items-center gap-2 text-sm font-bold text-[var(--store-muted)] md:flex">
            <a href="#servicos" className="rounded-full px-4 py-2 hover:bg-[var(--store-bg-soft)]">Servicos</a>
            <a href="#avaliacoes" className="rounded-full px-4 py-2 hover:bg-[var(--store-bg-soft)]">Avaliacoes</a>
            <a href="#contato" className="rounded-full px-4 py-2 hover:bg-[var(--store-bg-soft)]">Contato</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={shareShowcase}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--store-border)] bg-white"
              aria-label="Compartilhar vitrine"
            >
              <Share2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--store-border)] bg-white md:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => openBooking()}
              className="hidden h-11 rounded-full bg-[var(--store-primary)] px-5 font-black text-[var(--store-primary-contrast)] shadow-sm md:inline-flex md:items-center"
            >
              Agendar
            </button>
          </div>
        </div>
      </header>

      <section id="inicio" className="mx-auto grid max-w-7xl gap-6 px-4 pb-8 pt-5 lg:grid-cols-[minmax(0,1.05fr)_430px] lg:px-8 lg:pb-12 lg:pt-8">
        <div className="overflow-hidden rounded-[var(--store-radius)] border border-[var(--store-border)] bg-white shadow-[var(--store-shadow)]">
          <div className="relative grid min-h-[620px] overflow-hidden lg:min-h-[560px] lg:grid-cols-[0.92fr_1fr]">
            <div className="relative z-10 flex flex-col justify-between p-6 sm:p-9">
              <div>
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[var(--store-bg-soft)] px-3 py-2 text-xs font-black text-[var(--store-primary)]">
                    <ShieldCheck className="h-4 w-4" />
                    Atendimento verificado
                  </span>
                  {address ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-[var(--store-muted)] ring-1 ring-[var(--store-border)]">
                      <MapPin className="h-4 w-4" />
                      {address}
                    </span>
                  ) : null}
                </div>
                <h1 className="max-w-xl text-4xl font-black leading-[0.98] tracking-tight text-[var(--store-text)] sm:text-6xl">
                  {showcase.subtitle || `Agende com ${showcase.title}`}
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-[var(--store-muted)] sm:text-lg">
                  {showcase.description || organization.description || "Escolha o servico, veja horarios e fale com a equipe em poucos toques."}
                </p>
              </div>
              <div className="mt-8 grid gap-3 sm:flex">
                <button
                  type="button"
                  onClick={() => openBooking()}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[var(--store-primary)] px-6 text-base font-black text-[var(--store-primary-contrast)] shadow-xl"
                >
                  <CalendarDays className="h-5 w-5" />
                  Agendar agora
                </button>
                {whatsapp ? (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[var(--store-border)] bg-white px-6 text-base font-black text-[var(--store-text)]"
                  >
                    <MessageCircle className="h-5 w-5" />
                    WhatsApp
                  </a>
                ) : null}
              </div>
            </div>
            <div className="relative min-h-[320px] bg-[var(--store-bg-soft)] lg:min-h-full">
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
              ) : (
                <div className="flex h-full min-h-[320px] items-center justify-center">
                  <Store className="h-20 w-20 text-[var(--store-primary)] opacity-40" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 to-transparent p-5 lg:hidden">
                <p className="text-sm font-black text-white">{showcase.title}</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-[var(--store-radius)] border border-[var(--store-border)] bg-white p-5 shadow-[var(--store-shadow)] lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--store-bg-soft)] text-[var(--store-primary)]">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-black">Agendamento rapido</p>
              <p className="text-sm text-[var(--store-muted)]">Escolha um servico e reserve seu horario.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {services.slice(0, 3).map((service, index) => (
              <button
                key={service.id}
                type="button"
                onClick={() => openBooking(service.id)}
                className="grid grid-cols-[72px_1fr_auto] items-center gap-3 rounded-3xl border border-[var(--store-border)] bg-white p-2 text-left transition hover:border-[var(--store-primary)]"
              >
                <span className="h-16 overflow-hidden rounded-2xl">
                  <ServiceMedia service={service} index={index} compact />
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-sm font-black">{service.name}</strong>
                  <span className="text-xs font-bold text-[var(--store-muted)]">{formatDuration(service.duration_minutes)}</span>
                </span>
                <ChevronRight className="h-5 w-5 text-[var(--store-primary)]" />
              </button>
            ))}
            {services.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--store-border)] bg-[var(--store-bg)] p-5 text-sm text-[var(--store-muted)]">
                Esta vitrine ainda esta preparando os servicos.
              </div>
            ) : null}
          </div>
        </aside>
      </section>

      <section id="servicos" className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--store-primary)]">Servicos</p>
            <h2 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Escolha o melhor atendimento</h2>
          </div>
          <span className="hidden text-sm font-bold text-[var(--store-muted)] sm:block">{services.length} servicos publicados</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((service, index) => (
            <article key={service.id} className="overflow-hidden rounded-[1.7rem] border border-[var(--store-border)] bg-white shadow-sm">
              <div className="aspect-[16/10] overflow-hidden bg-[var(--store-bg-soft)]">
                <ServiceMedia service={service} index={index} />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-black leading-tight">{service.name}</h3>
                  <span className="shrink-0 rounded-full bg-[var(--store-bg-soft)] px-3 py-1 text-xs font-black text-[var(--store-primary)]">
                    Ativo
                  </span>
                </div>
                <p className="mt-3 min-h-12 text-sm leading-6 text-[var(--store-muted)]">
                  {service.description || "Servico personalizado conforme sua necessidade."}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-2xl bg-[var(--store-bg)] p-3">
                    <span className="block text-xs font-bold text-[var(--store-muted)]">Tempo</span>
                    <strong>{formatDuration(service.duration_minutes)}</strong>
                  </div>
                  <div className="rounded-2xl bg-[var(--store-bg)] p-3">
                    <span className="block text-xs font-bold text-[var(--store-muted)]">Valor</span>
                    <strong>{formatCurrency(service.price_cents)}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openBooking(service.id)}
                  className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--store-primary)] px-4 font-black text-[var(--store-primary-contrast)]"
                >
                  <CalendarDays className="h-5 w-5" />
                  Agendar
                </button>
              </div>
            </article>
          ))}
        </div>
        {services.length === 0 ? (
          <div className="rounded-[1.7rem] border border-dashed border-[var(--store-border)] bg-white p-8 text-center text-[var(--store-muted)]">
            Os servicos ainda nao foram publicados. Entre em contato para saber mais.
          </div>
        ) : null}
      </section>

      <section id="avaliacoes" className="mx-auto grid max-w-7xl gap-4 px-4 py-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div className="rounded-[1.7rem] border border-[var(--store-border)] bg-white p-6 shadow-sm">
          <Star className="h-8 w-8 fill-[var(--store-primary)] text-[var(--store-primary)]" />
          <h2 className="mt-4 text-3xl font-black">Prova social</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--store-muted)]">
            Quando houver avaliacoes cadastradas, elas aparecerao aqui com nota, depoimento e data. Por enquanto, esta vitrine preserva apenas informacoes reais.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Atendimento personalizado", Users],
            ["Profissionais especializados", ShieldCheck],
            ["Resposta rapida", MessageCircle],
            ["Agenda online", CalendarDays]
          ].map(([label, Icon]) => (
            <div key={String(label)} className="rounded-[1.7rem] border border-[var(--store-border)] bg-white p-5 shadow-sm">
              <Icon className="h-7 w-7 text-[var(--store-primary)]" />
              <p className="mt-4 font-black">{String(label)}</p>
              <p className="mt-1 text-sm text-[var(--store-muted)]">Informacao apresentada sem estatisticas inventadas.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--store-primary)]">Galeria</p>
            <h2 className="mt-1 text-3xl font-black tracking-tight">Veja o espaco e o portfolio</h2>
          </div>
        </div>
        {gallery.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {gallery.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPreviewImage(item)}
                className={`overflow-hidden rounded-[1.4rem] bg-[var(--store-bg-soft)] ${index === 0 ? "col-span-2 row-span-2" : ""}`}
                aria-label={`Ampliar imagem ${item.alt_text || index + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image_url} alt={item.alt_text ?? ""} loading="lazy" className="aspect-square h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.7rem] border border-dashed border-[var(--store-border)] bg-white p-8 text-center text-[var(--store-muted)]">
            <ImageIcon className="mx-auto mb-3 h-8 w-8 text-[var(--store-primary)]" />
            A galeria ainda nao tem imagens publicadas.
          </div>
        )}
      </section>

      <section id="contato" className="mx-auto max-w-7xl px-4 pb-28 pt-8 lg:px-8 lg:pb-10">
        <div className="rounded-[var(--store-radius)] border border-[var(--store-border)] bg-white p-6 shadow-[var(--store-shadow)]">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--store-primary)]">Contato</p>
              <h2 className="mt-1 text-3xl font-black">Fale com {showcase.title}</h2>
              {address ? <p className="mt-3 text-sm leading-6 text-[var(--store-muted)]">{address}</p> : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {primaryLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target={link.url.startsWith("http") ? "_blank" : undefined}
                  rel={link.url.startsWith("http") ? "noreferrer" : undefined}
                  className="flex min-h-14 items-center justify-between rounded-2xl border border-[var(--store-border)] px-4 font-black"
                >
                  <span className="flex items-center gap-2">
                    <link.icon className="h-5 w-5 text-[var(--store-primary)]" />
                    {link.label}
                  </span>
                  <ExternalLink className="h-4 w-4 text-[var(--store-muted)]" />
                </a>
              ))}
              {links.map((link) => {
                const url = safeExternalUrl(link.url);
                if (!url) return null;
                return (
                  <a
                    key={link.id}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-14 items-center justify-between rounded-2xl border border-[var(--store-border)] px-4 font-black"
                  >
                    <span className="flex items-center gap-2">
                      <LinkIcon className="h-5 w-5 text-[var(--store-primary)]" />
                      {link.label}
                    </span>
                    <ExternalLink className="h-4 w-4 text-[var(--store-muted)]" />
                  </a>
                );
              })}
              {primaryLinks.length === 0 && links.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--store-border)] bg-[var(--store-bg)] p-5 text-sm text-[var(--store-muted)] sm:col-span-2">
                  Os canais de contato ainda nao foram configurados.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-[var(--store-border)] bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] text-[11px] font-black text-[var(--store-muted)] shadow-2xl backdrop-blur-xl lg:hidden">
        <a href="#inicio" className="flex min-h-16 flex-col items-center justify-center gap-1 text-[var(--store-primary)]">
          <Store className="h-5 w-5" />
          Inicio
        </a>
        <a href="#servicos" className="flex min-h-16 flex-col items-center justify-center gap-1">
          <Sparkles className="h-5 w-5" />
          Servicos
        </a>
        <button
          type="button"
          onClick={() => openBooking()}
          className="-mt-5 flex min-h-20 flex-col items-center justify-center gap-1 text-[var(--store-primary)]"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--store-primary)] text-[var(--store-primary-contrast)] shadow-xl">
            <CalendarDays className="h-6 w-6" />
          </span>
          Agendar
        </button>
        <a href="#avaliacoes" className="flex min-h-16 flex-col items-center justify-center gap-1">
          <Star className="h-5 w-5" />
          Avaliacoes
        </a>
        <a href="#contato" className="flex min-h-16 flex-col items-center justify-center gap-1">
          <Phone className="h-5 w-5" />
          Contato
        </a>
      </nav>

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
        <button
          type="button"
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4"
          aria-label="Fechar imagem"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewImage.image_url} alt={previewImage.alt_text ?? ""} className="max-h-full max-w-full rounded-3xl object-contain" />
        </button>
      ) : null}
    </main>
  );
}
