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
  Store,
  Users,
  WalletCards
} from "lucide-react";
import type { Role } from "@/lib/constants/roles";
import { appModules, canUseModule } from "@/lib/modules";

const icons = {
  "/dashboard": LayoutDashboard,
  "/agenda": CalendarDays,
  "/crm": BriefcaseBusiness,
  "/atendimento": MessagesSquare,
  "/tarefas": FileText,
  "/servicos": Store,
  "/financeiro": WalletCards,
  "/relatorios": ClipboardList,
  "/vitrine": Store,
  "/automacoes": SlidersHorizontal,
  "/ia": Bot,
  "/configuracoes": Settings,
  "/leads": Users,
  "/pipeline": BriefcaseBusiness,
  "/clientes": Users,
  "/conversas": MessagesSquare,
  "/orcamentos": FileText,
  "/vendas": BadgeDollarSign,
  "/avaliacoes": Users,
  "/ia-sdr": Bot,
  "/usuarios": Users
};

export const shellNavItems = appModules.map((moduleItem) => ({
  ...moduleItem,
  icon: icons[moduleItem.href as keyof typeof icons] ?? LayoutDashboard
})) satisfies Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
  status: "active" | "disabled";
}>;

export type ShellNavItem = (typeof shellNavItems)[number];

export function canSeeNavItem(role: Role | null | undefined, item: ShellNavItem) {
  return canUseModule(role, item);
}
