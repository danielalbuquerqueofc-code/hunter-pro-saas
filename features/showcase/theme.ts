import type { CSSProperties } from "react";

type ShowcaseThemeInput = {
  primary_color?: string | null;
  accent_color?: string | null;
  background_color?: string | null;
  card_color?: string | null;
  text_color?: string | null;
  button_color?: string | null;
  button_text_color?: string | null;
  border_color?: string | null;
  radius_style?: string | null;
  shadow_style?: string | null;
  theme_key?: string | null;
  font_key?: string | null;
};

const legacyDefaultPrimary = "#f74e14";

export const showcaseThemeOptions = [
  {
    key: "clean_light",
    name: "Clean claro",
    description: "Visual neutro, claro e direto.",
    previewFrom: "#ffffff",
    previewTo: "#eef2f7"
  },
  {
    key: "premium_dark",
    name: "Premium escuro",
    description: "Contraste forte com acento sofisticado.",
    previewFrom: "#08110d",
    previewTo: "#0b1117"
  },
  {
    key: "beauty",
    name: "Beauty",
    description: "Delicado para beleza, estetica e cuidado.",
    previewFrom: "#fff1f7",
    previewTo: "#ffe4ef"
  },
  {
    key: "wellness",
    name: "Wellness",
    description: "Natural, leve e acolhedor.",
    previewFrom: "#eefdf4",
    previewTo: "#dcfce7"
  },
  {
    key: "professional_blue",
    name: "Azul profissional",
    description: "Confiante para servicos consultivos.",
    previewFrom: "#eff6ff",
    previewTo: "#dbeafe"
  },
  {
    key: "gold",
    name: "Gold",
    description: "Premium com sensacao de valor.",
    previewFrom: "#fffbeb",
    previewTo: "#fde68a"
  },
  {
    key: "modern",
    name: "Moderno",
    description: "Landing page clara com contraste comercial.",
    previewFrom: "#f8fafc",
    previewTo: "#e2e8f0"
  },
  {
    key: "elegant",
    name: "Elegante",
    description: "Sofisticado para negocios premium.",
    previewFrom: "#fff7ed",
    previewTo: "#f8e1d4"
  },
  {
    key: "minimal",
    name: "Minimalista",
    description: "Pouca cor, muito respiro e leitura simples.",
    previewFrom: "#ffffff",
    previewTo: "#f4f4f5"
  },
  {
    key: "dark",
    name: "Escuro",
    description: "Fundo escuro controlado com cards claros.",
    previewFrom: "#101014",
    previewTo: "#27272a"
  },
  {
    key: "light",
    name: "Claro",
    description: "Clean e universal para qualquer servico.",
    previewFrom: "#ffffff",
    previewTo: "#eef2ff"
  },
  {
    key: "automotive",
    name: "Automotivo",
    description: "Forte para oficinas, lava-jatos e servicos tecnicos.",
    previewFrom: "#f8fafc",
    previewTo: "#fee2e2"
  },
  {
    key: "professional",
    name: "Profissional",
    description: "Neutro para consultores e atendimentos especializados.",
    previewFrom: "#f5f7fb",
    previewTo: "#dbeafe"
  }
] as const;

export type ShowcaseThemeKey = (typeof showcaseThemeOptions)[number]["key"];

const themePalettes: Record<ShowcaseThemeKey, {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  soft: string;
  card: string;
}> = {
  clean_light: {
    primary: "#111827",
    secondary: "#475569",
    accent: "#22c55e",
    bg: "#f8fafc",
    soft: "#eef2f7",
    card: "#ffffff"
  },
  premium_dark: {
    primary: "#16a34a",
    secondary: "#0f172a",
    accent: "#111827",
    bg: "#f6f8f5",
    soft: "#e8f5ee",
    card: "#ffffff"
  },
  beauty: {
    primary: "#be185d",
    secondary: "#831843",
    accent: "#f472b6",
    bg: "#fff7fb",
    soft: "#fde7f1",
    card: "#ffffff"
  },
  wellness: {
    primary: "#15803d",
    secondary: "#166534",
    accent: "#86efac",
    bg: "#f5fff8",
    soft: "#dcfce7",
    card: "#ffffff"
  },
  professional_blue: {
    primary: "#0369a1",
    secondary: "#0f172a",
    accent: "#38bdf8",
    bg: "#f5f9ff",
    soft: "#dbeafe",
    card: "#ffffff"
  },
  gold: {
    primary: "#b45309",
    secondary: "#78350f",
    accent: "#fbbf24",
    bg: "#fffaf0",
    soft: "#fef3c7",
    card: "#ffffff"
  },
  modern: {
    primary: "#0f172a",
    secondary: "#334155",
    accent: "#14b8a6",
    bg: "#f8fafc",
    soft: "#e2e8f0",
    card: "#ffffff"
  },
  elegant: {
    primary: "#be185d",
    secondary: "#831843",
    accent: "#f9a8d4",
    bg: "#fff7fb",
    soft: "#fde7f1",
    card: "#ffffff"
  },
  minimal: {
    primary: "#18181b",
    secondary: "#52525b",
    accent: "#a1a1aa",
    bg: "#fafafa",
    soft: "#f4f4f5",
    card: "#ffffff"
  },
  dark: {
    primary: "#22c55e",
    secondary: "#16a34a",
    accent: "#86efac",
    bg: "#101014",
    soft: "#18181b",
    card: "#ffffff"
  },
  light: {
    primary: "#2563eb",
    secondary: "#1d4ed8",
    accent: "#93c5fd",
    bg: "#f8fbff",
    soft: "#e0ecff",
    card: "#ffffff"
  },
  automotive: {
    primary: "#dc2626",
    secondary: "#991b1b",
    accent: "#f97316",
    bg: "#f8fafc",
    soft: "#fee2e2",
    card: "#ffffff"
  },
  professional: {
    primary: "#0369a1",
    secondary: "#0f172a",
    accent: "#38bdf8",
    bg: "#f5f9ff",
    soft: "#dbeafe",
    card: "#ffffff"
  }
};

function normalizeHex(value?: string | null) {
  const color = String(value ?? "").trim();
  if (/^#[0-9a-f]{6}$/i.test(color)) return color.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(color)) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toLowerCase();
  }
  return null;
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16)
  };
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const values = [r, g, b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}

function contrastRatio(a: string, b: string) {
  const light = Math.max(luminance(a), luminance(b));
  const dark = Math.min(luminance(a), luminance(b));
  return (light + 0.05) / (dark + 0.05);
}

function readableText(background: string) {
  return contrastRatio(background, "#0f172a") >= contrastRatio(background, "#ffffff") ? "#0f172a" : "#ffffff";
}

function safePrimary(value: string) {
  const onWhite = contrastRatio(value, "#ffffff");
  const onSoft = contrastRatio(value, "#f8fafc");
  return onWhite >= 3.2 && onSoft >= 3.2 ? value : "#111827";
}

function resolvePrimary(showcase: ShowcaseThemeInput | null | undefined, fallback: string) {
  const customPrimary = normalizeHex(showcase?.primary_color);

  if (!customPrimary || customPrimary === legacyDefaultPrimary) return fallback;
  return safePrimary(customPrimary);
}

export function resolveShowcaseTheme(showcase: ShowcaseThemeInput | null | undefined): CSSProperties {
  const themeKey = showcase?.theme_key && showcase.theme_key in themePalettes ? showcase.theme_key as ShowcaseThemeKey : "beauty";
  const palette = themePalettes[themeKey];
  const primary = resolvePrimary(showcase, palette.primary);
  const accent = normalizeHex(showcase?.accent_color) ?? palette.accent;
  const background = normalizeHex(showcase?.background_color) ?? palette.bg;
  const card = normalizeHex(showcase?.card_color) ?? palette.card;
  const text = normalizeHex(showcase?.text_color) ?? readableText(background);
  const button = normalizeHex(showcase?.button_color) ?? primary;
  const buttonText = normalizeHex(showcase?.button_text_color) ?? readableText(button);
  const border = normalizeHex(showcase?.border_color) ?? (contrastRatio(card, "#e6eaf0") > 1.2 ? "#e6eaf0" : "#cbd5e1");
  const radius = showcase?.radius_style === "pill" ? "999px" : showcase?.radius_style === "soft" ? "18px" : "28px";
  const shadow = showcase?.shadow_style === "none"
    ? "none"
    : showcase?.shadow_style === "elevated"
      ? "0 34px 90px rgba(15, 23, 42, 0.18)"
      : "0 24px 80px rgba(15, 23, 42, 0.10)";

  return {
    "--theme-primary": primary,
    "--theme-primary-hover": palette.secondary,
    "--theme-primary-foreground": buttonText,
    "--theme-primary-contrast": buttonText,
    "--theme-secondary": palette.secondary,
    "--theme-accent": accent,
    "--theme-background": background,
    "--theme-bg": background,
    "--theme-bg-soft": palette.soft,
    "--theme-surface": card,
    "--theme-card": card,
    "--theme-text": text,
    "--theme-text-muted": "#667085",
    "--theme-muted": "#667085",
    "--theme-border": border,
    "--theme-focus": primary,
    "--theme-success": "#16a34a",
    "--theme-warning": "#d97706",
    "--theme-error": "#dc2626",
    "--theme-radius": radius,
    "--theme-shadow": shadow,
    "--store-primary": button,
    "--store-primary-hover": palette.secondary,
    "--store-primary-foreground": buttonText,
    "--store-primary-contrast": buttonText,
    "--store-secondary": palette.secondary,
    "--store-accent": accent,
    "--store-background": background,
    "--store-bg": background,
    "--store-bg-soft": palette.soft,
    "--store-surface": card,
    "--store-card": card,
    "--store-text": text,
    "--store-text-muted": "#667085",
    "--store-muted": "#667085",
    "--store-border": border,
    "--store-focus": primary,
    "--store-success": "#16a34a",
    "--store-warning": "#d97706",
    "--store-error": "#dc2626",
    "--store-radius": radius,
    "--store-shadow": shadow
  } as CSSProperties;
}

export function getFontClass(fontKey?: string | null) {
  if (fontKey === "serif") return "font-serif";
  if (fontKey === "rounded") return "[font-family:ui-rounded,system-ui,sans-serif]";
  return "font-sans";
}
