import Link from "next/link";
import { Eye, Menu, Search, Sparkles } from "lucide-react";
import { GlobalSearch } from "@/components/shell/global-search";
import { NotificationCenter } from "@/components/shell/notification-center";
import { OrganizationSwitcher } from "@/components/shell/organization-switcher";
import { QuickActions } from "@/components/shell/quick-actions";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { UserMenu } from "@/components/shell/user-menu";

type TopbarProps = {
  email?: string | null;
  organizationName: string;
  publicHref: string;
};

export function Topbar({ email, organizationName, publicHref }: TopbarProps) {
  return (
    <div className="flex min-h-16 items-center gap-3 px-4 lg:px-6">
      <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--hp-accent-soft)] text-lg font-black text-[var(--hp-accent)] ring-1 ring-emerald-400/25">
          H
        </span>
        <span className="hidden text-lg font-black tracking-tight sm:inline">Hunter</span>
        <span className="rounded-full bg-[var(--hp-accent)] px-2 py-0.5 text-[10px] font-black uppercase text-[#04100a]">
          Pro
        </span>
      </Link>

      <div className="hidden lg:flex lg:items-center lg:gap-4">
        <OrganizationSwitcher name={organizationName} />
        <GlobalSearch />
        <QuickActions />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden md:block">
          <NotificationCenter />
        </div>
        <Link
          href="/crm"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 lg:hidden"
          aria-label="Buscar"
        >
          <Search className="h-5 w-5" />
        </Link>
        <Link
          href="/ia"
          className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 md:flex"
          aria-label="Assistente"
        >
          <Sparkles className="h-5 w-5" />
        </Link>
        <Link
          href={publicHref}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
          aria-label="Abrir vitrine"
        >
          <Eye className="h-5 w-5" />
        </Link>
        <div className="hidden md:block">
          <ThemeToggle />
        </div>
        <div className="hidden sm:block">
          <UserMenu email={email} />
        </div>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#04100a] lg:hidden"
          type="button"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
