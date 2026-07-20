"use client";

import { useActionState, useMemo, useState } from "react";
import {
  Bot,
  ChevronsUpDown,
  Copy,
  Eye,
  GripVertical,
  Instagram,
  MessageCircle,
  Palette,
  Phone,
  Play,
  QrCode,
  Save,
  Share2,
  Sparkles,
  Store
} from "lucide-react";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import {
  createShowcaseLinkStateAction,
  saveShowcaseStateAction,
  type ShowcaseActionState
} from "@/features/showcase/actions";

type ShowcaseFormData = {
  title: string | null;
  subtitle: string | null;
  description: string | null;
  hero_image_url: string | null;
  whatsapp: string | null;
  instagram_url: string | null;
  status: string | null;
} | null;

type ShowcaseLink = {
  id: string;
  label: string;
  url: string;
};

type ShowcaseService = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
};

type ShowcaseStudioProps = {
  organizationName: string;
  publicUrl: string;
  showcase: ShowcaseFormData;
  links: ShowcaseLink[];
  services: ShowcaseService[];
  analytics: {
    views: number | null;
    clicks: number | null;
    appointments: number;
  };
};

const initialState: ShowcaseActionState = { ok: false };
const themes = [
  { name: "Studio premium", accent: "#22c55e", bg: "from-[#08110d] to-[#0b1117]" },
  { name: "Clean claro", accent: "#111827", bg: "from-[#f8fafc] to-[#e2e8f0]" },
  { name: "Solar", accent: "#f59e0b", bg: "from-[#1c1205] to-[#111827]" },
  { name: "Azul service", accent: "#38bdf8", bg: "from-[#06121f] to-[#0f172a]" }
];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function ShowcaseStudio({
  organizationName,
  publicUrl,
  showcase,
  links,
  services,
  analytics
}: ShowcaseStudioProps) {
  const [state, action] = useActionState(saveShowcaseStateAction, initialState);
  const [linkState, linkAction] = useActionState(createShowcaseLinkStateAction, initialState);
  const [themeIndex, setThemeIndex] = useState(0);
  const [title, setTitle] = useState(showcase?.title ?? organizationName);
  const [subtitle, setSubtitle] = useState(showcase?.subtitle ?? "Atendimento simples, profissional e com agenda online.");
  const [description, setDescription] = useState(showcase?.description ?? "Escolha um servico, veja horarios e fale com a equipe em poucos toques.");
  const [heroImageUrl, setHeroImageUrl] = useState(showcase?.hero_image_url ?? "");
  const [whatsapp, setWhatsapp] = useState(showcase?.whatsapp ?? "");
  const [instagramUrl, setInstagramUrl] = useState(showcase?.instagram_url ?? "");
  const selectedTheme = themes[themeIndex];
  const qrCodeUrl = useMemo(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicUrl)}`,
    [publicUrl]
  );
  const aiSuggestions = [
    `Descricao: "${title} ajuda clientes a agendarem servicos com praticidade, clareza e atendimento humano."`,
    "Servico destaque: crie um pacote de entrada com duracao curta para reduzir atrito.",
    "Campanha: publique o link da vitrine nos stories com chamada para horarios desta semana."
  ];
  const copyPublicUrl = () => {
    void navigator.clipboard?.writeText(publicUrl);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <div className="grid gap-5">
        <section className="hp-card rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-[var(--hp-accent)]">Estudio da vitrine</p>
              <h2 className="mt-1 text-3xl font-black">Personalize sua pagina publica</h2>
            </div>
            <Save className="h-7 w-7 text-zinc-500" />
          </div>

          <form action={action} className="mt-6 grid gap-5">
            <FormMessage type="success">{state.message}</FormMessage>
            <FormMessage>{state.error}</FormMessage>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-zinc-300">Nome da vitrine</Label>
                <Input id="title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} required className="h-14 rounded-2xl border-white/10 bg-white/10 text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-zinc-300">Status</Label>
                <Select id="status" name="status" defaultValue={showcase?.status ?? "DRAFT"} className="h-14 rounded-2xl border-white/10 bg-white/10 text-white">
                  <option value="DRAFT">Rascunho</option>
                  <option value="PUBLISHED">Publicado</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle" className="text-zinc-300">Chamada principal</Label>
              <Input id="subtitle" name="subtitle" value={subtitle} onChange={(event) => setSubtitle(event.target.value)} className="h-14 rounded-2xl border-white/10 bg-white/10 text-white" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-zinc-300">Descricao</Label>
              <Textarea id="description" name="description" value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-32 rounded-2xl border-white/10 bg-white/10 text-white" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="heroImageUrl" className="text-zinc-300">Foto/capa URL</Label>
                <Input id="heroImageUrl" name="heroImageUrl" value={heroImageUrl} onChange={(event) => setHeroImageUrl(event.target.value)} className="h-14 rounded-2xl border-white/10 bg-white/10 text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-zinc-300">WhatsApp</Label>
                <Input id="whatsapp" name="whatsapp" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} className="h-14 rounded-2xl border-white/10 bg-white/10 text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagramUrl" className="text-zinc-300">Instagram</Label>
                <Input id="instagramUrl" name="instagramUrl" value={instagramUrl} onChange={(event) => setInstagramUrl(event.target.value)} className="h-14 rounded-2xl border-white/10 bg-white/10 text-white" />
              </div>
            </div>

            <SubmitButton className="h-14 rounded-full bg-[var(--hp-accent)] text-base font-black text-[#04100a] hover:bg-emerald-400">
              Salvar vitrine
            </SubmitButton>
          </form>
        </section>

        <section className="hp-card rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Palette className="h-6 w-6 text-[var(--hp-accent)]" />
            <h2 className="text-2xl font-black">Templates visuais</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {themes.map((theme, index) => (
              <button
                key={theme.name}
                type="button"
                onClick={() => setThemeIndex(index)}
                className={`rounded-[1.5rem] border p-4 text-left transition ${
                  index === themeIndex ? "border-emerald-400 bg-emerald-400/10" : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <div className={`h-20 rounded-2xl bg-gradient-to-br ${theme.bg}`} />
                <p className="mt-3 font-black">{theme.name}</p>
                <p className="text-sm text-zinc-500">Clique para testar no preview.</p>
              </button>
            ))}
          </div>
        </section>

        <section className="hp-card rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-[var(--hp-accent)]">Links e secoes</p>
              <h2 className="text-2xl font-black">Organize por prioridade</h2>
            </div>
            <ChevronsUpDown className="h-6 w-6 text-zinc-500" />
          </div>
          <form action={linkAction} className="mt-5 grid gap-3">
            <FormMessage type="success">{linkState.message}</FormMessage>
            <FormMessage>{linkState.error}</FormMessage>
            <Input name="label" placeholder="Instagram, WhatsApp, YouTube..." required className="h-14 rounded-2xl border-white/10 bg-white/10 text-white" />
            <Input name="url" placeholder="https://..." required className="h-14 rounded-2xl border-white/10 bg-white/10 text-white" />
            <SubmitButton variant="secondary" className="h-12 rounded-full font-black">Adicionar link</SubmitButton>
          </form>
          <div className="mt-5 grid gap-3">
            {[...links, { id: "services", label: "Servicos", url: "Secao interna" }, { id: "faq", label: "Perguntas frequentes", url: "Secao preparada" }].map((link) => (
              <div key={link.id} draggable className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-4">
                <GripVertical className="h-5 w-5 text-zinc-500" />
                <div className="min-w-0 flex-1">
                  <p className="font-black">{link.label}</p>
                  <p className="truncate text-sm text-zinc-500">{link.url}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="hp-card rounded-[1.75rem] p-5">
            <Eye className="h-6 w-6 text-[var(--hp-accent)]" />
            <p className="mt-4 text-3xl font-black">{analytics.views ?? "0"}</p>
            <p className="text-sm text-zinc-500">Visualizacoes</p>
          </div>
          <div className="hp-card rounded-[1.75rem] p-5">
            <Share2 className="h-6 w-6 text-sky-300" />
            <p className="mt-4 text-3xl font-black">{analytics.clicks ?? links.length}</p>
            <p className="text-sm text-zinc-500">Cliques em links</p>
          </div>
          <div className="hp-card rounded-[1.75rem] p-5">
            <Store className="h-6 w-6 text-amber-300" />
            <p className="mt-4 text-3xl font-black">{analytics.appointments}</p>
            <p className="text-sm text-zinc-500">Agendamentos</p>
          </div>
        </section>
      </div>

      <aside className="grid gap-5 xl:sticky xl:top-32 xl:self-start">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl">
          <div className={`min-h-48 bg-gradient-to-br ${selectedTheme.bg} p-4`}>
            {heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroImageUrl} alt="" className="h-48 w-full rounded-[1.5rem] object-cover" />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/10">
                <Store className="h-12 w-12 text-white/50" />
              </div>
            )}
          </div>
          <div className="p-5">
            <h3 className="text-3xl font-black">{title}</h3>
            <p className="mt-2 text-sm font-semibold" style={{ color: selectedTheme.accent }}>{subtitle}</p>
            <p className="mt-3 text-sm text-zinc-400">{description}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <a href={publicUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[var(--hp-accent)] px-4 py-3 text-center font-black text-[#04100a]">
                Agendar
              </a>
              <a href={whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : "#"} className="rounded-full border border-white/10 px-4 py-3 text-center font-black">
                WhatsApp
              </a>
            </div>
            <div className="mt-5 grid gap-3">
              {services.slice(0, 3).map((service) => (
                <div key={service.id} className="rounded-2xl bg-white/[0.05] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black">{service.name}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{service.description ?? "Servico disponivel para agendamento."}</p>
                    </div>
                    <p className="shrink-0 text-sm font-black">{formatCurrency(service.price_cents)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="hp-card rounded-[2rem] p-5">
          <div className="flex items-center gap-3">
            <QrCode className="h-6 w-6 text-[var(--hp-accent)]" />
            <h2 className="text-xl font-black">Compartilhar</h2>
          </div>
          <div className="mt-5 rounded-[1.5rem] bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCodeUrl} alt="QR Code da vitrine" className="mx-auto h-40 w-40" />
          </div>
          <div className="mt-4 rounded-2xl bg-white/[0.05] p-3 text-sm text-zinc-400">
            <p className="truncate">{publicUrl}</p>
          </div>
          <button
            type="button"
            onClick={copyPublicUrl}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-black text-[#04100a]"
          >
            <Copy className="h-4 w-4" />
            Copiar link
          </button>
        </section>

        <section className="rounded-[2rem] border border-emerald-400/20 bg-[var(--hp-accent-soft)] p-5">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-[var(--hp-accent)]" />
            <h2 className="text-xl font-black">IA assistente</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {aiSuggestions.map((suggestion) => (
              <div key={suggestion} className="rounded-2xl bg-black/20 p-3 text-sm text-zinc-300">
                <Sparkles className="mb-2 h-4 w-4 text-[var(--hp-accent)]" />
                {suggestion}
              </div>
            ))}
          </div>
        </section>

        <section className="hp-card rounded-[2rem] p-5">
          <h2 className="text-xl font-black">Redes e mídia</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <a href={instagramUrl || "#"} className="rounded-2xl bg-white/[0.05] p-4 text-center font-bold">
              <Instagram className="mx-auto mb-2 h-5 w-5 text-pink-300" />
              Instagram
            </a>
            <a href={whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : "#"} className="rounded-2xl bg-white/[0.05] p-4 text-center font-bold">
              <MessageCircle className="mx-auto mb-2 h-5 w-5 text-[var(--hp-accent)]" />
              WhatsApp
            </a>
            <div className="rounded-2xl bg-white/[0.05] p-4 text-center font-bold">
              <Play className="mx-auto mb-2 h-5 w-5 text-red-300" />
              Videos
            </div>
            <div className="rounded-2xl bg-white/[0.05] p-4 text-center font-bold">
              <Phone className="mx-auto mb-2 h-5 w-5 text-sky-300" />
              Ligar
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
