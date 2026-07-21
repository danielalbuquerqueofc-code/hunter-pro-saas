"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  FileText,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  MessagesSquare,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  UserCircle,
  Users,
  WalletCards,
  X
} from "lucide-react";
import { signOutAction } from "@/features/auth/actions";

type MobileNavItem = {
  href: string;
  label: string;
};

const icons = {
  "/dashboard": Home,
  "/agenda": CalendarDays,
  "/clientes": Users,
  "/atendimento": MessagesSquare,
  "/tarefas": FileText,
  "/crm": BriefcaseBusiness,
  "/servicos": Store,
  "/financeiro": WalletCards,
  "/relatorios": ClipboardList,
  "/vitrine": Store,
  "/automacoes": SlidersHorizontal,
  "/ia": Bot,
  "/configuracoes": Settings,
  "/minha-conta": UserCircle,
  "/usuarios": Users,
  "/plano-assinatura": WalletCards,
  "/ajuda": HelpCircle
};

const sections = [
  {
    title: "Principal",
    hrefs: ["/dashboard", "/agenda", "/clientes", "/atendimento", "/tarefas"]
  },
  {
    title: "Gestao",
    hrefs: ["/crm", "/servicos", "/financeiro", "/relatorios"]
  },
  {
    title: "Crescimento",
    hrefs: ["/vitrine", "/automacoes", "/ia"]
  },
  {
    title: "Sistema",
    hrefs: ["/configuracoes", "/minha-conta", "/usuarios", "/plano-assinatura", "/ajuda"]
  }
];

function itemIcon(href: string) {
  return icons[href as keyof typeof icons] ?? Home;
}

export function MobileNavigation({ items, isSuperAdmin = false }: { items: MobileNavItem[]; isSuperAdmin?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const itemByHref = new Map(items.map((item) => [item.href, item]));
  const preferred = ["/dashboard", "/agenda", "/clientes", "/vitrine"]
    .map((href) => itemByHref.get(href))
    .filter((item): item is MobileNavItem => Boolean(item));
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto grid max-w-md grid-cols-5 border-t border-[var(--hp-line)] bg-[var(--hp-surface)] pb-[env(safe-area-inset-bottom)] text-[11px] font-bold text-slate-500 shadow-2xl shadow-slate-900/10 backdrop-blur-xl lg:hidden">
        {preferred.map((item) => {
          const Icon = itemIcon(item.href);
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
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 transition hover:text-slate-950"
          aria-label="Abrir menu completo"
        >
          <span className="rounded-2xl p-2">
            <Menu className="h-5 w-5" />
          </span>
          <span>Mais</span>
        </button>
      </nav>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute bottom-0 left-0 right-0 max-h-[86vh] overflow-y-auto rounded-t-[2rem] border border-[var(--hp-line)] bg-[var(--hp-surface)] p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-600">Menu completo</p>
                <h2 className="mt-1 text-2xl font-black text-[var(--hp-text)]">Hunter Pro</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--hp-line)] bg-[var(--hp-surface-soft)]"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              {isSuperAdmin ? (
                <section className="space-y-2">
                  <p className="px-1 text-xs font-black uppercase tracking-wide text-[var(--hp-muted)]">
                    Plataforma
                  </p>
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex min-h-14 items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 text-sm font-black text-orange-700 transition"
                  >
                    <ShieldCheck className="h-5 w-5 shrink-0" />
                    Administracao da plataforma
                  </Link>
                </section>
              ) : null}

              {sections.map((section) => {
                const sectionItems = section.hrefs
                  .map((href) => itemByHref.get(href))
                  .filter((item): item is MobileNavItem => Boolean(item));

                if (!sectionItems.length) return null;

                return (
                  <section key={section.title}>
                    <p className="mb-2 px-1 text-xs font-black uppercase tracking-wide text-[var(--hp-muted)]">
                      {section.title}
                    </p>
                    <div className="grid gap-2">
                      {sectionItems.map((item) => {
                        const Icon = itemIcon(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 text-sm font-black transition ${
                              isActive(item.href)
                                ? "border-emerald-200 bg-[var(--hp-accent-soft)] text-emerald-700"
                                : "border-[var(--hp-line)] bg-[var(--hp-surface)] text-[var(--hp-text)]"
                            }`}
                          >
                            <Icon className="h-5 w-5 shrink-0" />
                            {item.href === "/dashboard" ? "Inicio" : item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                );
              })}

              <section>
                <p className="mb-2 px-1 text-xs font-black uppercase tracking-wide text-[var(--hp-muted)]">Sessao</p>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-[var(--hp-line)] bg-[var(--hp-surface)] px-4 text-sm font-black text-[var(--hp-text)]"
                  >
                    <LogOut className="h-5 w-5" />
                    Sair
                  </button>
                </form>
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
