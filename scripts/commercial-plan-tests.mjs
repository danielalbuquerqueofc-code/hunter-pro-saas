import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function assertIncludes(file, value, message) {
  if (!file.includes(value)) {
    throw new Error(message);
  }
}

const migration = read("supabase/migrations/0014_official_commercial_plans.sql");
const limits = read("features/billing/plan-limits.ts");
const usersActions = read("features/users/actions.ts");
const billingActions = read("features/billing/actions.ts");
const adminActions = read("features/admin/actions.ts");
const planPage = read("app/(app)/plano-assinatura/page.tsx");

for (const column of [
  "slug text",
  "monthly_price numeric(10,2)",
  "minimum_users integer",
  "maximum_users integer",
  "status text",
  "display_order integer"
]) {
  assertIncludes(migration, column, `Migration comercial precisa criar ${column}.`);
}

for (const plan of [
  ["Start", "97.00", "1", "1"],
  ["Pro", "197.00", "1", "2"],
  ["Scale", "297.00", "3", "5"]
]) {
  const [name, price, min, max] = plan;
  assertIncludes(migration, `'${name}'`, `Plano ${name} precisa existir.`);
  assertIncludes(migration, price, `Plano ${name} precisa ter valor mensal ${price}.`);
  assertIncludes(migration, `\n    ${min},\n    ${max},`, `Plano ${name} precisa ter limites ${min}-${max}.`);
}

assertIncludes(migration, "create table if not exists public.plan_change_history", "Historico de troca de plano precisa existir.");
assertIncludes(limits, "assertCanAddOrganizationUser", "Helper precisa validar limite antes de convidar usuario.");
assertIncludes(limits, ".in(\"status\", [\"ACTIVE\", \"INVITED\"])", "Membros ativos/convidados precisam ocupar vaga.");
assertIncludes(limits, ".eq(\"status\", \"SENT\")", "Convites pendentes precisam reservar vaga.");
assertIncludes(usersActions, "assertCanAddOrganizationUser", "Convite precisa chamar validacao de limite no backend.");
assertIncludes(usersActions, "Ja existe um convite pendente", "Convite duplicado precisa ser bloqueado.");
assertIncludes(billingActions, "assertCanMoveToPlan", "Troca de plano precisa validar downgrade.");
assertIncludes(billingActions, "plan_change_history", "Troca de plano precisa registrar historico.");
assertIncludes(adminActions, "assignOrganizationPlanAction", "Superadmin precisa atribuir plano.");
assertIncludes(adminActions, "customMonthlyPrice", "Superadmin precisa ter valor customizado.");
assertIncludes(planPage, "planUsage.usedSlots", "Tela do cliente precisa mostrar uso de usuarios.");

console.log("Commercial plan readiness checks passed");
