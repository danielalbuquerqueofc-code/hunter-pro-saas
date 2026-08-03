import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredGuardFiles = [
  "app/(app)/agenda/page.tsx",
  "app/(app)/atendimento/page.tsx",
  "app/(app)/automacoes/page.tsx",
  "app/(app)/avaliacoes/page.tsx",
  "app/(app)/clientes/page.tsx",
  "app/(app)/clientes/[id]/page.tsx",
  "app/(app)/conversas/page.tsx",
  "app/(app)/crm/page.tsx",
  "app/(app)/financeiro/page.tsx",
  "app/(app)/ia/page.tsx",
  "app/(app)/ia-sdr/page.tsx",
  "app/(app)/leads/page.tsx",
  "app/(app)/leads/[id]/page.tsx",
  "app/(app)/minha-conta/page.tsx",
  "app/(app)/orcamentos/page.tsx",
  "app/(app)/orcamentos/[id]/page.tsx",
  "app/(app)/plano-assinatura/page.tsx",
  "app/(app)/pipeline/page.tsx",
  "app/(app)/relatorios/page.tsx",
  "app/(app)/servicos/page.tsx",
  "app/(app)/tarefas/page.tsx",
  "app/(app)/usuarios/page.tsx",
  "app/(app)/vendas/page.tsx",
  "app/(app)/ajuda/page.tsx",
  "app/(app)/vitrine/page.tsx"
];

const failures = [];

for (const relativePath of requiredGuardFiles) {
  const source = readFileSync(join(root, relativePath), "utf8");
  if (!source.includes("requireOrganizationAccess(") && !source.includes("requireEnabledOrganizationModuleAccess(")) {
    failures.push(`${relativePath} nao chama guard de organizacao.`);
  }
}

const dashboardPage = readFileSync(join(root, "app/(app)/dashboard/page.tsx"), "utf8");
const dashboardComponents = [
  "components/dashboard/today-appointments.tsx",
  "components/dashboard/sales-summary.tsx",
  "components/dashboard/financial-summary.tsx",
  "components/dashboard/pipeline-summary.tsx",
  "components/dashboard/dashboard-calendar.tsx",
  "components/dashboard/activity-feed.tsx",
  "components/dashboard/task-list.tsx",
  "components/dashboard/ai-alerts.tsx"
];

for (const relativePath of dashboardComponents) {
  const source = readFileSync(join(root, relativePath), "utf8");
  if (source.includes("@/features/dashboard/mock")) {
    failures.push(`${relativePath} ainda importa mock de dashboard.`);
  }
}

if (dashboardPage.includes("@/features/dashboard/mock")) {
  failures.push("app/(app)/dashboard/page.tsx ainda importa mock de dashboard.");
}

const nav = readFileSync(join(root, "components/shell/navigation.ts"), "utf8");
if (!nav.includes("canUseModule")) {
  failures.push("Menu principal nao usa feature flags de modulo.");
}
if (!nav.includes("/minha-conta") || !nav.includes("/plano-assinatura") || !nav.includes("/usuarios")) {
  failures.push("Menu principal nao expoe conta, plano e usuarios conforme permissao.");
}

const mobileNav = readFileSync(join(root, "components/shell/mobile-navigation.tsx"), "utf8");
if (!mobileNav.includes("Menu completo") || !mobileNav.includes("Principal") || !mobileNav.includes("Gestao") || !mobileNav.includes("Sistema")) {
  failures.push("Menu mobile nao possui drawer completo com agrupamentos.");
}

const layout = readFileSync(join(root, "app/(app)/layout.tsx"), "utf8");
if (!layout.includes("redirectIfOrganizationCannotUseApp")) {
  failures.push("Layout privado nao bloqueia empresas sem acesso comercial.");
}

const organizationGuard = readFileSync(join(root, "features/organizations/guards.ts"), "utf8");
if (!organizationGuard.includes("redirectIfOrganizationCannotUseApp")) {
  failures.push("Guard de organizacao nao valida trial/bloqueio.");
}

const accessControl = readFileSync(join(root, "features/organizations/access-control.ts"), "utf8");
if (!accessControl.includes("trial_expired") || !accessControl.includes("blocked")) {
  failures.push("Regra central de acesso nao cobre teste expirado e bloqueio.");
}

const blockedPage = readFileSync(join(root, "app/(public)/acesso-bloqueado/page.tsx"), "utf8");
if (!blockedPage.includes("signOutAction") || !blockedPage.includes("/precos")) {
  failures.push("Tela de acesso bloqueado nao oferece saida e caminho de plano.");
}

const adminLayout = readFileSync(join(root, "app/admin/layout.tsx"), "utf8");
const adminCompanyDetail = readFileSync(join(root, "app/admin/empresas/[id]/page.tsx"), "utf8");
if (!adminLayout.includes("requireSuperAdmin") || !adminCompanyDetail.includes("updateOrganizationAccessAction")) {
  failures.push("Admin global nao possui protecao SUPER_ADMIN e acoes de controle de acesso.");
}

const accessMigration = readFileSync(
  join(root, "supabase/migrations/0009_access_trial_admin_controls.sql"),
  "utf8"
);
if (!accessMigration.includes("trial_ends_at") || !accessMigration.includes("expire_organization_trials")) {
  failures.push("Migration 0009 nao prepara trial de 5 dias e expiracao.");
}

if (failures.length > 0) {
  console.error("Falhas de auditoria de seguranca:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Auditoria de seguranca local passou.");
