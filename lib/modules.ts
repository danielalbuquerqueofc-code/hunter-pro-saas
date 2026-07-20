import type { Role } from "@/lib/constants/roles";

export type ModuleStatus = "active" | "disabled";

export type AppModule = {
  href: string;
  label: string;
  roles: Role[];
  status: ModuleStatus;
};

export const appModules = [
  { href: "/dashboard", label: "Visao geral", roles: ["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT", "PROFESSIONAL", "FINANCIAL"], status: "active" },
  { href: "/agenda", label: "Agenda", roles: ["OWNER", "ADMIN", "MANAGER", "ATTENDANT", "PROFESSIONAL"], status: "active" },
  { href: "/crm", label: "CRM", roles: ["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT"], status: "active" },
  { href: "/atendimento", label: "Atendimento", roles: ["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT"], status: "active" },
  { href: "/tarefas", label: "Tarefas", roles: ["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT", "PROFESSIONAL", "FINANCIAL"], status: "active" },
  { href: "/servicos", label: "Servicos", roles: ["OWNER", "ADMIN", "MANAGER"], status: "active" },
  { href: "/financeiro", label: "Financeiro", roles: ["OWNER", "ADMIN", "FINANCIAL"], status: "active" },
  { href: "/relatorios", label: "Relatorios", roles: ["OWNER", "ADMIN", "MANAGER", "FINANCIAL"], status: "active" },
  { href: "/vitrine", label: "Vitrine digital", roles: ["OWNER", "ADMIN", "MANAGER"], status: "active" },
  { href: "/automacoes", label: "Automacoes", roles: ["OWNER", "ADMIN", "MANAGER"], status: "active" },
  { href: "/ia", label: "IA", roles: ["OWNER", "ADMIN", "MANAGER"], status: "active" },
  { href: "/configuracoes", label: "Configuracoes", roles: ["OWNER", "ADMIN"], status: "active" },
  { href: "/leads", label: "Leads", roles: ["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT"], status: "disabled" },
  { href: "/pipeline", label: "Pipeline", roles: ["OWNER", "ADMIN", "MANAGER", "SALES"], status: "disabled" },
  { href: "/clientes", label: "Clientes", roles: ["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT"], status: "disabled" },
  { href: "/conversas", label: "Conversas", roles: ["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT"], status: "disabled" },
  { href: "/orcamentos", label: "Orcamentos", roles: ["OWNER", "ADMIN", "MANAGER", "SALES"], status: "disabled" },
  { href: "/vendas", label: "Vendas", roles: ["OWNER", "ADMIN", "MANAGER", "SALES", "FINANCIAL"], status: "disabled" },
  { href: "/avaliacoes", label: "Avaliacoes", roles: ["OWNER", "ADMIN", "MANAGER", "ATTENDANT"], status: "disabled" },
  { href: "/ia-sdr", label: "IA SDR", roles: ["OWNER", "ADMIN", "MANAGER", "SALES"], status: "disabled" },
  { href: "/usuarios", label: "Usuarios", roles: ["OWNER", "ADMIN"], status: "disabled" }
] satisfies AppModule[];

export function getModuleByHref(href: string) {
  return appModules.find((moduleItem) => moduleItem.href === href);
}

export function canUseModule(role: Role | null | undefined, moduleItem: AppModule) {
  return moduleItem.status === "active" && (role === "SUPER_ADMIN" || Boolean(role && moduleItem.roles.includes(role)));
}
