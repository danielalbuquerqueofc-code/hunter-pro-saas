import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
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
    <div className="min-h-screen bg-[var(--hp-bg)] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070b0f]/90 text-white shadow-2xl shadow-black/20 backdrop-blur-xl">
        <Topbar email={email} organizationName={organizationName} publicHref={publicHref} />
        <AppSidebar items={visibleNav} />
      </header>

      <main className="min-w-0 pb-28 lg:pb-8">{children}</main>

      <MobileNavigation items={visibleNav} />

      <div className="fixed bottom-24 right-5 z-40 lg:bottom-8">
        <Link
          href="/agenda"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--hp-accent)] text-[#04100a] shadow-2xl shadow-emerald-500/30 transition hover:scale-105"
          aria-label="Novo agendamento"
        >
          <CalendarPlus className="h-7 w-7" />
        </Link>
      </div>

      <div className="sr-only">Usuario logado: {email}</div>
    </div>
  );
}
