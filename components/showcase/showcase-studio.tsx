"use client";

import { type CSSProperties, useActionState, useMemo, useState } from "react";
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
import { resolveShowcaseTheme, showcaseThemeOptions } from "@/features/showcase/theme";
import { createClient } from "@/lib/supabase/client";

type ShowcaseFormData = {
  title: string | null;
  subtitle: string | null;
  description: string | null;
  hero_image_url: string | null;
  logo_url: string | null;
  whatsapp: string | null;
  phone: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  address_text: string | null;
  primary_color?: string | null;
  theme_key: string | null;
  font_key: string | null;
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
  organizationId: string;
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

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function ShowcaseStudio({
  organizationId,
  organizationName,
  publicUrl,
  showcase,
  links,
  services,
  analytics
}: ShowcaseStudioProps) {
  const [state, action] = useActionState(saveShowcaseStateAction, initialState);
  const [linkState, linkAction] = useActionState(createShowcaseLinkStateAction, initialState);
  const [themeKey, setThemeKey] = useState(showcase?.theme_key ?? "clean_light");
  const [fontKey, setFontKey] = useState(showcase?.font_key ?? "sans");
  const [title, setTitle] = useState(showcase?.title ?? organizationName);
  const [subtitle, setSubtitle] = useState(showcase?.subtitle ?? "Atendimento simples, profissional e com agenda online.");
  const [description, setDescription] = useState(showcase?.description ?? "Escolha um servico, veja horarios e fale com a equipe em poucos toques.");
  const [heroImageUrl, setHeroImageUrl] = useState(showcase?.hero_image_url ?? "");
  const [logoUrl, setLogoUrl] = useState(showcase?.logo_url ?? "");
  const [whatsapp, setWhatsapp] = useState(showcase?.whatsapp ?? "");
  const [phone, setPhone] = useState(showcase?.phone ?? "");
  const [instagramUrl, setInstagramUrl] = useState(showcase?.instagram_url ?? "");
  const [facebookUrl, setFacebookUrl] = useState(showcase?.facebook_url ?? "");
  const [tiktokUrl, setTiktokUrl] = useState(showcase?.tiktok_url ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(showcase?.youtube_url ?? "");
  const [addressText, setAddressText] = useState(showcase?.address_text ?? "");
  const selectedTheme = showcaseThemeOptions.find((theme) => theme.key === themeKey) ?? showcaseThemeOptions[0];
  const previewStyle = resolveShowcaseTheme({ primary_color: showcase?.primary_color, theme_key: themeKey, font_key: fontKey }) as CSSProperties;
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
  const resetToSaved = () => {
    setThemeKey(showcase?.theme_key ?? "clean_light");
    setFontKey(showcase?.font_key ?? "sans");
    setTitle(showcase?.title ?? organizationName);
    setSubtitle(showcase?.subtitle ?? "Atendimento simples, profissional e com agenda online.");
    setDescription(showcase?.description ?? "Escolha um servico, veja horarios e fale com a equipe em poucos toques.");
    setHeroImageUrl(showcase?.hero_image_url ?? "");
    setLogoUrl(showcase?.logo_url ?? "");
    setWhatsapp(showcase?.whatsapp ?? "");
    setPhone(showcase?.phone ?? "");
    setInstagramUrl(showcase?.instagram_url ?? "");
    setFacebookUrl(showcase?.facebook_url ?? "");
    setTiktokUrl(showcase?.tiktok_url ?? "");
    setYoutubeUrl(showcase?.youtube_url ?? "");
    setAddressText(showcase?.address_text ?? "");
  };
  const restoreDefaultTheme = () => {
    const confirmed = window.confirm("Restaurar o tema padrao da vitrine? As demais informacoes continuam no formulario ate voce salvar.");
    if (!confirmed) return;
    setThemeKey("beauty");
    setFontKey("sans");
  };
  const uploadAsset = async (file: File, kind: "logo" | "cover") => {
    const supabase = createClient();
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeKind = kind === "logo" ? "logo" : "cover";
    const path = `${organizationId}/showcase/${safeKind}-${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("showcase-assets").upload(path, file, {
      cacheControl: "3600",
      upsert: true
    });

    if (error) {
      window.alert("Nao foi possivel enviar a imagem. Verifique se a migration 0008 foi aplicada no Supabase.");
      return;
    }

    const { data } = supabase.storage.from("showcase-assets").getPublicUrl(path);
    if (kind === "logo") setLogoUrl(data.publicUrl);
    if (kind === "cover") setHeroImageUrl(data.publicUrl);
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
                <Label htmlFor="title" className="text-slate-600">Nome da vitrine</Label>
                <Input id="title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} required className="h-14 rounded-2xl border-slate-200 bg-white text-slate-950" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-slate-600">Status</Label>
                <Select id="status" name="status" defaultValue={showcase?.status ?? "DRAFT"} className="h-14 rounded-2xl border-slate-200 bg-white text-slate-950">
                  <option value="DRAFT">Rascunho</option>
                  <option value="PUBLISHED">Publicado</option>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="themeKey" className="text-slate-600">Tema visual</Label>
                <Select id="themeKey" name="themeKey" value={themeKey} onChange={(event) => setThemeKey(event.target.value)} className="h-14 rounded-2xl border-slate-200 bg-white text-slate-950">
                  {showcaseThemeOptions.map((theme) => (
                    <option key={theme.key} value={theme.key}>{theme.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fontKey" className="text-slate-600">Tipografia</Label>
                <Select id="fontKey" name="fontKey" value={fontKey} onChange={(event) => setFontKey(event.target.value)} className="h-14 rounded-2xl border-slate-200 bg-white text-slate-950">
                  <option value="sans">Moderna</option>
                  <option value="serif">Editorial</option>
                  <option value="rounded">Amigavel</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle" className="text-slate-600">Chamada principal</Label>
              <Input id="subtitle" name="subtitle" value={subtitle} onChange={(event) => setSubtitle(event.target.value)} className="h-14 rounded-2xl border-slate-200 bg-white text-slate-950" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-600">Descricao</Label>
              <Textarea id="description" name="description" value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-32 rounded-2xl border-slate-200 bg-white text-slate-950" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <AssetUploadField
                id="logoUpload"
                label="Logo ou foto de perfil"
                value={logoUrl}
                onUpload={(file) => uploadAsset(file, "logo")}
                onUrlChange={setLogoUrl}
              />
              <AssetUploadField
                id="coverUpload"
                label="Capa da vitrine"
                value={heroImageUrl}
                onUpload={(file) => uploadAsset(file, "cover")}
                onUrlChange={setHeroImageUrl}
              />
              <input type="hidden" name="logoUrl" value={logoUrl} />
              <input type="hidden" name="heroImageUrl" value={heroImageUrl} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-slate-600">WhatsApp</Label>
                <Input id="whatsapp" name="whatsapp" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} className="h-14 rounded-2xl border-slate-200 bg-white text-slate-950" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-600">Telefone</Label>
                <Input id="phone" name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} className="h-14 rounded-2xl border-slate-200 bg-white text-slate-950" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagramUrl" className="text-slate-600">Instagram</Label>
                <Input id="instagramUrl" name="instagramUrl" value={instagramUrl} onChange={(event) => setInstagramUrl(event.target.value)} className="h-14 rounded-2xl border-slate-200 bg-white text-slate-950" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="facebookUrl" className="text-slate-600">Facebook</Label>
                <Input id="facebookUrl" name="facebookUrl" value={facebookUrl} onChange={(event) => setFacebookUrl(event.target.value)} className="h-14 rounded-2xl border-slate-200 bg-white text-slate-950" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiktokUrl" className="text-slate-600">TikTok</Label>
                <Input id="tiktokUrl" name="tiktokUrl" value={tiktokUrl} onChange={(event) => setTiktokUrl(event.target.value)} className="h-14 rounded-2xl border-slate-200 bg-white text-slate-950" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtubeUrl" className="text-slate-600">YouTube</Label>
                <Input id="youtubeUrl" name="youtubeUrl" value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} className="h-14 rounded-2xl border-slate-200 bg-white text-slate-950" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressText" className="text-slate-600">Endereco ou area de atendimento</Label>
              <Input id="addressText" name="addressText" value={addressText} onChange={(event) => setAddressText(event.target.value)} className="h-14 rounded-2xl border-slate-200 bg-white text-slate-950" />
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <SubmitButton className="h-14 rounded-full bg-[var(--hp-accent)] text-base font-black text-[#04100a] hover:bg-emerald-400">
                Salvar alteracoes
              </SubmitButton>
              <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-slate-900">
                <Eye className="h-4 w-4" />
                Visualizar vitrine
              </a>
              <button type="button" onClick={resetToSaved} className="h-14 rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-slate-700">
                Cancelar alteracoes
              </button>
            </div>
          </form>
        </section>

        <section className="hp-card rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Palette className="h-6 w-6 text-[var(--hp-accent)]" />
            <h2 className="text-2xl font-black">Templates visuais</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {showcaseThemeOptions.map((theme) => (
              <button
                key={theme.name}
                type="button"
                onClick={() => setThemeKey(theme.key)}
                className={`rounded-[1.5rem] border p-4 text-left transition ${
                  theme.key === themeKey ? "border-emerald-400 bg-emerald-400/10" : "border-slate-200 bg-slate-50"
                }`}
              >
                <div
                  className="h-20 rounded-2xl"
                  style={{ background: `linear-gradient(135deg, ${theme.previewFrom}, ${theme.previewTo})` }}
                />
                <p className="mt-3 font-black">{theme.name}</p>
                <p className="text-sm text-zinc-500">{theme.description}</p>
                <span className="mt-3 inline-flex rounded-full bg-white px-3 py-2 text-xs font-black text-slate-900 shadow-sm">
                  Aplicar tema
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={restoreDefaultTheme} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">
              Restaurar padrao
            </button>
            <a href={publicUrl} target="_blank" rel="noreferrer" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white">
              Visualizar vitrine
            </a>
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
            <Input name="label" placeholder="Instagram, WhatsApp, YouTube..." required className="h-14 rounded-2xl border-slate-200 bg-white text-slate-950" />
            <Input name="url" placeholder="https://..." required className="h-14 rounded-2xl border-slate-200 bg-white text-slate-950" />
            <SubmitButton variant="secondary" className="h-12 rounded-full font-black">Adicionar link</SubmitButton>
          </form>
          <div className="mt-5 grid gap-3">
            {[...links, { id: "services", label: "Servicos", url: "Secao interna" }, { id: "faq", label: "Perguntas frequentes", url: "Secao preparada" }].map((link) => (
              <div key={link.id} draggable className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
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
        <section style={previewStyle} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[var(--store-card)] text-[var(--store-text)] shadow-2xl">
          <div
            className="min-h-48 p-4"
            style={{ background: `linear-gradient(135deg, ${selectedTheme.previewFrom}, ${selectedTheme.previewTo})` }}
          >
            {heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroImageUrl} alt="" className="h-48 w-full rounded-[1.5rem] object-cover" />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-[1.5rem] border border-slate-200 bg-slate-100">
                <Store className="h-12 w-12 text-white/50" />
              </div>
            )}
          </div>
          <div className="p-5">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="-mt-14 mb-4 h-20 w-20 rounded-[1.5rem] border-4 border-white object-cover shadow-xl" />
            ) : null}
            <h3 className="text-3xl font-black">{title}</h3>
            <p className="mt-2 text-sm font-semibold text-[var(--store-primary)]">{subtitle}</p>
            <p className="mt-3 text-sm text-[var(--store-muted)]">{description}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <a href={publicUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[var(--store-primary)] px-4 py-3 text-center font-black text-[var(--store-primary-contrast)]">
                Agendar
              </a>
              <a href={whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : "#"} className="rounded-full border border-[var(--store-border)] px-4 py-3 text-center font-black">
                WhatsApp
              </a>
            </div>
            <div className="mt-5 grid gap-3">
              {services.slice(0, 3).map((service) => (
                <div key={service.id} className="rounded-2xl bg-[var(--store-bg-soft)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black">{service.name}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--store-muted)]">{service.description ?? "Servico disponivel para agendamento."}</p>
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
          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-zinc-400">
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
              <div key={suggestion} className="rounded-2xl bg-black/20 p-3 text-sm text-slate-600">
                <Sparkles className="mb-2 h-4 w-4 text-[var(--hp-accent)]" />
                {suggestion}
              </div>
            ))}
          </div>
        </section>

        <section className="hp-card rounded-[2rem] p-5">
          <h2 className="text-xl font-black">Redes e mídia</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <a href={instagramUrl || "#"} className="rounded-2xl bg-slate-50 p-4 text-center font-bold">
              <Instagram className="mx-auto mb-2 h-5 w-5 text-pink-300" />
              Instagram
            </a>
            <a href={whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : "#"} className="rounded-2xl bg-slate-50 p-4 text-center font-bold">
              <MessageCircle className="mx-auto mb-2 h-5 w-5 text-[var(--hp-accent)]" />
              WhatsApp
            </a>
            <a href={youtubeUrl || "#"} className="rounded-2xl bg-slate-50 p-4 text-center font-bold">
              <Play className="mx-auto mb-2 h-5 w-5 text-red-300" />
              YouTube
            </a>
            <a href={phone ? `tel:${phone.replace(/\D/g, "")}` : "#"} className="rounded-2xl bg-slate-50 p-4 text-center font-bold">
              <Phone className="mx-auto mb-2 h-5 w-5 text-sky-300" />
              Ligar
            </a>
          </div>
        </section>
      </aside>
    </div>
  );
}

function AssetUploadField({
  id,
  label,
  value,
  onUpload,
  onUrlChange
}: {
  id: string;
  label: string;
  value: string;
  onUpload: (file: File) => void;
  onUrlChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  return (
    <div className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
      <Label htmlFor={id} className="text-slate-600">{label}</Label>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-32 w-full rounded-2xl object-cover" />
      ) : (
        <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-white/15 text-sm text-zinc-500">
          Nenhuma imagem enviada
        </div>
      )}
      <Input
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        disabled={uploading}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (file.size > 5 * 1024 * 1024) {
            window.alert("Envie uma imagem de ate 5MB.");
            return;
          }
          setUploading(true);
          try {
            await onUpload(file);
          } finally {
            setUploading(false);
          }
        }}
        className="h-12 rounded-2xl border-slate-200 bg-white text-slate-950"
      />
      <Input
        value={value}
        onChange={(event) => onUrlChange(event.target.value)}
        placeholder="Ou cole uma URL de imagem"
        className="h-12 rounded-2xl border-slate-200 bg-white text-slate-950"
      />
      <p className="text-xs text-zinc-500">{uploading ? "Enviando imagem..." : "PNG, JPG, WEBP ou GIF ate 5MB."}</p>
    </div>
  );
}
