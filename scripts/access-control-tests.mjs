import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const source = readFileSync(join(root, "features/organizations/access-control.ts"), "utf8");

const requiredStatuses = ["trial", "active", "suspended", "trial_expired", "blocked", "cancelled"];
const failures = [];

for (const status of requiredStatuses) {
  if (!source.includes(`"${status}"`)) {
    failures.push(`Status ${status} nao esta coberto pela regra central.`);
  }
}

if (!source.includes("86_400_000")) {
  failures.push("Calculo de dias restantes do teste nao foi encontrado.");
}

if (!source.includes("redirect(`/acesso-bloqueado")) {
  failures.push("Redirecionamento para acesso bloqueado nao foi encontrado.");
}

if (failures.length > 0) {
  console.error("Falhas nos testes de acesso:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Testes locais de acesso passaram.");
