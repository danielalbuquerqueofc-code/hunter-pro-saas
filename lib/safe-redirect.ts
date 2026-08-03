export function getSafeInternalPath(value: FormDataEntryValue | string | null | undefined, fallback = "/dashboard") {
  const next = String(value ?? "").trim();

  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  if (next.includes("\\") || next.includes("\n") || next.includes("\r")) return fallback;

  try {
    const parsed = new URL(next, "https://hunter-pro.local");
    if (parsed.origin !== "https://hunter-pro.local") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
