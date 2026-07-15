import Link from "next/link";
import {
  BarChart3,
  Bot,
  CalendarDays,
  DollarSign,
  ListTodo,
  MessagesSquare,
  KanbanSquare,
  LayoutDashboard,
  Settings,
  Shield,
  SlidersHorizontal,
  Store,
  Users,
  Wrench
} from "lucide-react";
import { signOutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { formatInitials } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/crm", label: "CRM", icon: KanbanSquare },
  { href: "/atendimento", label: "Atendimento", icon: MessagesSquare },
  { href: "/tarefas", label: "Tarefas", icon: ListTodo },
  { href: "/vitrine", label: "Vitrine", icon: Store },
  { href: "/servicos", label: "Servicos", icon: Wrench },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/relatorios", label: "Relatorios", icon: BarChart3 },
  { href: "/automacoes", label: "Automacoes", icon: SlidersHorizontal },
  { href: "/ia", label: "IA SDR", icon: Bot },
  { href: "/configuracoes", label: "Empresa", icon: Settings },
  { href: "/admin", label: "Admin", icon: Shield }
];

type AppSidebarProps = {
  email?: string | null;
  organizationName?: string | null;
};

export function AppSidebar({ email, organizationName }: AppSidebarProps) {
  return (
    <aside className="flex min-h-screen w-72 flex-col bg-brand-ink p-5 text-white">
      <Link href="/dashboard" className="mb-8 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-orange text-sm font-black">
          {formatInitials(organizationName)}
        </span>
        <span>
          <strong className="block">Hunter Pro</strong>
          <span className="text-sm text-zinc-400">Plataforma SaaS</span>
        </span>
      </Link>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/10 hover:text-white"
          >
            <item.icon className="h-4 w-4 text-brand-orange" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm text-zinc-300">
          <Users className="h-4 w-4 text-brand-orange" />
          Usuario ativo
        </div>
        <p className="truncate text-sm font-semibold">{email}</p>
        <form action={signOutAction} className="mt-4">
          <Button type="submit" variant="secondary" className="w-full">
            Sair
          </Button>
        </form>
      </div>
    </aside>
  );
}
