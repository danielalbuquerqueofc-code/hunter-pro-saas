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
  "app/(app)/orcamentos/page.tsx",
  "app/(app)/orcamentos/[id]/page.tsx",
  "app/(app)/pipeline/page.tsx",
  "app/(app)/relatorios/page.tsx",
  "app/(app)/servicos/page.tsx",
  "app/(app)/tarefas/page.tsx",
  "app/(app)/usuarios/page.tsx",
  "app/(app)/vendas/page.tsx",
  "app/(app)/vitrine/page.tsx"
];

const failures = [];

for (const relativePath of requiredGuardFiles) {
  const source = readFileSync(join(root, relativePath), "utf8");
  if (!source.includes("requireOrganizationAccess(")) {
    failures.push(`${relativePath} nao chama requireOrganizationAccess.`);
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

if (failures.length > 0) {
  console.error("Falhas de auditoria de seguranca:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Auditoria de seguranca local passou.");
