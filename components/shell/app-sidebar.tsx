import Link from "next/link";
import type { ShellNavItem } from "@/components/shell/navigation";

export function AppSidebar({ items }: { items: ShellNavItem[] }) {
  return (
    <nav className="flex min-h-11 items-center gap-1 overflow-x-auto border-t border-white/20 bg-white px-4 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 lg:px-5">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex h-11 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-semibold hover:border-brand-orange hover:text-brand-orange"
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
