import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, Sparkles } from "lucide-react";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { MobileNavigation } from "@/components/shell/mobile-navigation";
import { canSeeNavItem, shellNavItems } from "@/components/shell/navigation";
import { Topbar } from "@/components/shell/topbar";
import type { Role } from "@/lib/constants/roles";

type AppShellProps = {
  children: ReactNode;
  email?: string | null;
  organizationName: string;
  organizationSlug?: string | null;
  role?: Role | null;
};

export function AppShell({
  children,
  email,
  organizationName,
  organizationSlug,
  role
}: AppShellProps) {
  const visibleNav = shellNavItems.filter((item) => canSeeNavItem(role, item));
  const publicHref = organizationSlug ? `/p/${organizationSlug}` : "/vitrine";

  return (
    <div className="min-h-screen bg-[#eef1f7] text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <header className="sticky top-0 z-30 border-b border-red-900/20 bg-brand-orange text-white shadow-sm">
        <Topbar email={email} organizationName={organizationName} publicHref={publicHref} />
        <AppSidebar items={visibleNav} />
      </header>

      <main className="min-w-0 pb-24 lg:pb-8">{children}</main>

      <MobileNavigation items={visibleNav} />

      <div className="fixed bottom-20 right-5 z-40 flex flex-col gap-3 lg:bottom-6">
        <Link
          href="/atendimento"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-xl shadow-sky-500/30"
          aria-label="Atendimento rapido"
        >
          <Bell className="h-6 w-6" />
        </Link>
        <Link
          href="/ia-sdr"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-xl shadow-violet-600/30"
          aria-label="IA SDR"
        >
          <Sparkles className="h-6 w-6" />
        </Link>
      </div>

      <div className="sr-only">Usuario logado: {email}</div>
    </div>
  );
}
