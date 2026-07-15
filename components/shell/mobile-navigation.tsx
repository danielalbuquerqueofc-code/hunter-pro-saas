import Link from "next/link";
import { Menu } from "lucide-react";
import type { ShellNavItem } from "@/components/shell/navigation";

export function MobileNavigation({ items }: { items: ShellNavItem[] }) {
  const preferred = ["/dashboard", "/agenda", "/clientes", "/vendas"]
    .map((href) => items.find((item) => item.href === href))
    .filter((item): item is ShellNavItem => Boolean(item));
  const moreHref =
    items.find((item) => item.href === "/servicos")?.href ??
    items.find((item) => item.href === "/configuracoes")?.href ??
    "/dashboard";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] text-[11px] font-bold text-zinc-600 shadow-2xl lg:hidden">
      {preferred.map((item) => (
        <Link key={item.href} href={item.href} className="flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2">
          <item.icon className="h-5 w-5 text-brand-orange" />
          <span className="max-w-full truncate">{item.href === "/dashboard" ? "Inicio" : item.label}</span>
        </Link>
      ))}
      <Link href={moreHref} className="flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2">
        <Menu className="h-5 w-5 text-brand-orange" />
        <span>Mais</span>
      </Link>
    </nav>
  );
}
