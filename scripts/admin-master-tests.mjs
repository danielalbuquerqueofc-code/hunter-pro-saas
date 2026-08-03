import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function assertFile(path) {
  if (!existsSync(join(root, path))) {
    failures.push(`Arquivo obrigatorio ausente: ${path}`);
  }
}

function assertIncludes(source, needle, message) {
  if (!source.includes(needle)) failures.push(message);
}

[
  "app/admin/layout.tsx",
  "app/admin/page.tsx",
  "app/admin/empresas/page.tsx",
  "app/admin/empresas/[id]/page.tsx",
  "app/admin/usuarios/page.tsx",
  "app/admin/planos/page.tsx",
  "app/admin/assinaturas/page.tsx",
  "app/admin/pagamentos/page.tsx",
  "app/admin/atividades/page.tsx",
  "app/admin/configuracoes/page.tsx",
  "components/admin/admin-shell.tsx",
  "features/admin/actions.ts",
  "features/admin/queries.ts",
  "features/organizations/current.ts",
  "components/shell/app-shell.tsx",
  "supabase/migrations/0017_master_admin_panel.sql"
].forEach(assertFile);

const layout = read("app/admin/layout.tsx");
assertIncludes(layout, "requireSuperAdmin", "Layout /admin precisa exigir SUPER_ADMIN no servidor.");

const actions = read("features/admin/actions.ts");
[
  "updateOrganizationAccessAction",
  "assignOrganizationPlanAction",
  "upsertPlanAction",
  "updateAdminMemberAction",
  "transferOrganizationOwnerAction",
  "createLimitOverrideAction",
  "createManualPaymentAction",
  "startImpersonationAction",
  "hunter_impersonation_session",
  "audit_logs"
].forEach((needle) => assertIncludes(actions, needle, `Acao administrativa ausente: ${needle}`));

const currentOrganization = read("features/organizations/current.ts");
[
  "hunter_impersonation_session",
  "admin_impersonation_sessions",
  "SUPER_ADMIN"
].forEach((needle) => assertIncludes(currentOrganization, needle, `Contexto de impersonacao incompleto: ${needle}`));

const appShell = read("components/shell/app-shell.tsx");
[
  "Modo suporte ativo",
  "endImpersonationAction",
  "Encerrar suporte"
].forEach((needle) => assertIncludes(appShell, needle, `Aviso de suporte ausente: ${needle}`));

const migration = read("supabase/migrations/0017_master_admin_panel.sql");
[
  "organization_limit_overrides",
  "admin_impersonation_sessions",
  "payments",
  "public.is_super_admin()",
  "enable row level security"
].forEach((needle) => assertIncludes(migration, needle, `Migration master incompleta: ${needle}`));

const queries = read("features/admin/queries.ts");
[
  "getAdminDashboard",
  "getPlatformOrganizations",
  "getAdminOrganizationDetail",
  "getAdminUsers",
  "getAdminPlans",
  "getAdminSubscriptionsAndPayments",
  "getAdminAuditLogs"
].forEach((needle) => assertIncludes(queries, needle, `Consulta admin ausente: ${needle}`));

if (failures.length > 0) {
  console.error("Falhas no painel master:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Admin master checks passed.");
