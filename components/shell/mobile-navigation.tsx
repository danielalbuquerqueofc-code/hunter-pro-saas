"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Menu, Store, Users, WalletCards } from "lucide-react";

type MobileNavItem = {
  href: string;
  label: string;
};

const icons = {
  "/dashboard": Home,
  "/agenda": CalendarDays,
  "/clientes": Users,
  "/vitrine": Store,
  "/financeiro": WalletCards
};

export function MobileNavigation({ items }: { items: MobileNavItem[] }) {
  const pathname = usePathname();
  const preferred = ["/dashboard", "/agenda", "/clientes", "/vitrine"]
    .map((href) => items.find((item) => item.href === href))
    .filter((item): item is MobileNavItem => Boolean(item));
  const moreHref =
    items.find((item) => item.href === "/configuracoes")?.href ??
    items.find((item) => item.href === "/financeiro")?.href ??
    "/dashboard";
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto grid max-w-md grid-cols-5 border-t border-[var(--hp-line)] bg-[var(--hp-surface)] pb-[env(safe-area-inset-bottom)] text-[11px] font-bold text-slate-500 shadow-2xl shadow-slate-900/10 backdrop-blur-xl lg:hidden">
      {preferred.map((item) => (
        (() => {
          const Icon = icons[item.href as keyof typeof icons] ?? Home;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 transition ${
                isActive(item.href) ? "text-emerald-600" : "hover:text-slate-950"
              }`}
            >
              <span className={`rounded-2xl p-2 ${isActive(item.href) ? "bg-[var(--hp-accent-soft)]" : ""}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="max-w-full truncate">{item.href === "/dashboard" ? "Inicio" : item.label}</span>
            </Link>
          );
        })()
      ))}
      <Link
        href={moreHref}
        className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 transition ${
          isActive(moreHref) ? "text-emerald-600" : "hover:text-slate-950"
        }`}
      >
        <span className={`rounded-2xl p-2 ${isActive(moreHref) ? "bg-[var(--hp-accent-soft)]" : ""}`}>
          <Menu className="h-5 w-5" />
        </span>
        <span>Mais</span>
      </Link>
    </nav>
  );
}
