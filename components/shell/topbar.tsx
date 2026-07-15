import Link from "next/link";
import { Eye, HelpCircle, Menu } from "lucide-react";
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
    <div className="flex min-h-16 items-center gap-5 px-4 lg:px-6">
      <Link href="/dashboard" className="flex shrink-0 items-center gap-3">
        <span className="text-2xl font-black tracking-tight">HUNTER</span>
        <span className="rounded bg-white px-2 py-1 text-[10px] font-black uppercase text-brand-orange">
          Pro
        </span>
      </Link>

      <OrganizationSwitcher name={organizationName} />
      <GlobalSearch />
      <QuickActions />

      <div className="ml-auto flex items-center gap-2">
        <NotificationCenter />
        <Link
          href="/configuracoes"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
          aria-label="Ajuda"
        >
          <HelpCircle className="h-5 w-5" />
        </Link>
        <Link
          href={publicHref}
          className="hidden h-10 w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 md:flex"
          aria-label="Abrir vitrine"
        >
          <Eye className="h-5 w-5" />
        </Link>
        <ThemeToggle />
        <UserMenu email={email} />
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-orange lg:hidden"
          type="button"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
