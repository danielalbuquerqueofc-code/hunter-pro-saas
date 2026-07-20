import Link from "next/link";
import type { ShellNavItem } from "@/components/shell/navigation";

export function AppSidebar({ items }: { items: ShellNavItem[] }) {
  return (
    <nav className="hp-scrollbar hidden min-h-12 items-center gap-2 overflow-x-auto border-t border-slate-100 bg-white px-4 text-slate-600 lg:flex lg:px-5">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition hover:bg-emerald-50 hover:text-emerald-700"
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
