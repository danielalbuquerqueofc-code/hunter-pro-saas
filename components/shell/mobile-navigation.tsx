"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import type { ShellNavItem } from "@/components/shell/navigation";

export function MobileNavigation({ items }: { items: ShellNavItem[] }) {
  const pathname = usePathname();
  const preferred = ["/dashboard", "/agenda", "/clientes", "/vitrine"]
    .map((href) => items.find((item) => item.href === href))
    .filter((item): item is ShellNavItem => Boolean(item));
  const moreHref =
    items.find((item) => item.href === "/financeiro")?.href ??
    items.find((item) => item.href === "/configuracoes")?.href ??
    "/dashboard";
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto grid max-w-md grid-cols-5 border-t border-white/10 bg-[#080d12]/95 pb-[env(safe-area-inset-bottom)] text-[11px] font-bold text-zinc-400 shadow-2xl shadow-black/40 backdrop-blur-xl lg:hidden">
      {preferred.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 transition ${
            isActive(item.href) ? "text-[var(--hp-accent)]" : "hover:text-white"
          }`}
        >
          <span className={`rounded-2xl p-2 ${isActive(item.href) ? "bg-[var(--hp-accent-soft)]" : ""}`}>
            <item.icon className="h-5 w-5" />
          </span>
          <span className="max-w-full truncate">{item.href === "/dashboard" ? "Inicio" : item.label}</span>
        </Link>
      ))}
      <Link
        href={moreHref}
        className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 transition ${
          isActive(moreHref) ? "text-[var(--hp-accent)]" : "hover:text-white"
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
