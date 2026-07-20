import type { CSSProperties } from "react";

type ShowcaseThemeInput = {
  primary_color?: string | null;
  theme_key?: string | null;
  font_key?: string | null;
};

const themePalettes = {
  clean_light: {
    primary: "#111827",
    accent: "#22c55e",
    bg: "#f8fafc",
    soft: "#eef2f7"
  },
  premium_dark: {
    primary: "#16a34a",
    accent: "#111827",
    bg: "#f6f8f5",
    soft: "#e8f5ee"
  },
  beauty: {
    primary: "#be185d",
    accent: "#f472b6",
    bg: "#fff7fb",
    soft: "#fde7f1"
  },
  wellness: {
    primary: "#15803d",
    accent: "#86efac",
    bg: "#f5fff8",
    soft: "#dcfce7"
  },
  professional_blue: {
    primary: "#0369a1",
    accent: "#38bdf8",
    bg: "#f5f9ff",
    soft: "#dbeafe"
  },
  gold: {
    primary: "#b45309",
    accent: "#fbbf24",
    bg: "#fffaf0",
    soft: "#fef3c7"
  }
} as const;

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

export function resolveShowcaseTheme(showcase: ShowcaseThemeInput | null | undefined): CSSProperties {
  const themeKey = showcase?.theme_key && showcase.theme_key in themePalettes ? showcase.theme_key : "beauty";
  const palette = themePalettes[themeKey as keyof typeof themePalettes];
  const primary = safePrimary(normalizeHex(showcase?.primary_color) ?? palette.primary);
  const buttonText = readableText(primary);

  return {
    "--store-primary": primary,
    "--store-primary-contrast": buttonText,
    "--store-accent": palette.accent,
    "--store-bg": palette.bg,
    "--store-bg-soft": palette.soft,
    "--store-card": "#ffffff",
    "--store-text": "#121826",
    "--store-muted": "#667085",
    "--store-border": "#e6eaf0",
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
