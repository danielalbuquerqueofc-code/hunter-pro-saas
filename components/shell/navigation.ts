import {
  BadgeDollarSign,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  SlidersHorizontal,
  Star,
  Store,
  UserPlus,
  Users,
  WalletCards
} from "lucide-react";
import type { Role } from "@/lib/constants/roles";

export const shellNavItems = [
  { href: "/dashboard", label: "Visao geral", icon: LayoutDashboard, roles: ["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT", "PROFESSIONAL", "FINANCIAL"] },
  { href: "/agenda", label: "Agenda", icon: CalendarDays, roles: ["OWNER", "ADMIN", "MANAGER", "ATTENDANT", "PROFESSIONAL"] },
  { href: "/leads", label: "Leads", icon: UserPlus, roles: ["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT"] },
  { href: "/pipeline", label: "Pipeline", icon: BriefcaseBusiness, roles: ["OWNER", "ADMIN", "MANAGER", "SALES"] },
  { href: "/clientes", label: "Clientes", icon: Users, roles: ["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT"] },
  { href: "/conversas", label: "Conversas", icon: MessagesSquare, roles: ["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT"] },
  { href: "/orcamentos", label: "Orcamentos", icon: FileText, roles: ["OWNER", "ADMIN", "MANAGER", "SALES"] },
  { href: "/vendas", label: "Vendas", icon: BadgeDollarSign, roles: ["OWNER", "ADMIN", "MANAGER", "SALES", "FINANCIAL"] },
  { href: "/financeiro", label: "Financeiro", icon: WalletCards, roles: ["OWNER", "ADMIN", "FINANCIAL"] },
  { href: "/relatorios", label: "Relatorios", icon: ClipboardList, roles: ["OWNER", "ADMIN", "MANAGER", "FINANCIAL"] },
  { href: "/vitrine", label: "Vitrine digital", icon: Store, roles: ["OWNER", "ADMIN", "MANAGER"] },
  { href: "/avaliacoes", label: "Avaliacoes", icon: Star, roles: ["OWNER", "ADMIN", "MANAGER", "ATTENDANT"] },
  { href: "/ia-sdr", label: "IA SDR", icon: Bot, roles: ["OWNER", "ADMIN", "MANAGER", "SALES"] },
  { href: "/automacoes", label: "Automacoes", icon: SlidersHorizontal, roles: ["OWNER", "ADMIN", "MANAGER"] },
  { href: "/usuarios", label: "Usuarios", icon: Users, roles: ["OWNER", "ADMIN"] },
  { href: "/configuracoes", label: "Configuracoes", icon: Settings, roles: ["OWNER", "ADMIN"] }
] satisfies Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}>;

export type ShellNavItem = (typeof shellNavItems)[number];

export function canSeeNavItem(role: Role | null | undefined, roles: Role[]) {
  return role === "SUPER_ADMIN" || Boolean(role && roles.includes(role));
}
