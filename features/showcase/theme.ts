import type { CSSProperties } from "react";

type ShowcaseThemeInput = {
  primary_color?: string | null;
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
  const buttonText = readableText(primary);

  return {
    "--theme-primary": primary,
    "--theme-primary-hover": palette.secondary,
    "--theme-primary-foreground": buttonText,
    "--theme-primary-contrast": buttonText,
    "--theme-secondary": palette.secondary,
    "--theme-accent": palette.accent,
    "--theme-background": palette.bg,
    "--theme-bg": palette.bg,
    "--theme-bg-soft": palette.soft,
    "--theme-surface": palette.card,
    "--theme-card": palette.card,
    "--theme-text": "#121826",
    "--theme-text-muted": "#667085",
    "--theme-muted": "#667085",
    "--theme-border": "#e6eaf0",
    "--theme-focus": primary,
    "--theme-success": "#16a34a",
    "--theme-warning": "#d97706",
    "--theme-error": "#dc2626",
    "--theme-radius": "28px",
    "--theme-shadow": "0 24px 80px rgba(15, 23, 42, 0.10)",
    "--store-primary": primary,
    "--store-primary-hover": palette.secondary,
    "--store-primary-foreground": buttonText,
    "--store-primary-contrast": buttonText,
    "--store-secondary": palette.secondary,
    "--store-accent": palette.accent,
    "--store-background": palette.bg,
    "--store-bg": palette.bg,
    "--store-bg-soft": palette.soft,
    "--store-surface": palette.card,
    "--store-card": palette.card,
    "--store-text": "#121826",
    "--store-text-muted": "#667085",
    "--store-muted": "#667085",
    "--store-border": "#e6eaf0",
    "--store-focus": primary,
    "--store-success": "#16a34a",
    "--store-warning": "#d97706",
    "--store-error": "#dc2626",
    "--store-radius": "28px",
    "--store-shadow": "0 24px 80px rgba(15, 23, 42, 0.10)"
  } as CSSProperties;
}

export function getFontClass(fontKey?: string | null) {
  if (fontKey === "serif") return "font-serif";
  if (fontKey === "rounded") return "[font-family:ui-rounded,system-ui,sans-serif]";
  return "font-sans";
}
