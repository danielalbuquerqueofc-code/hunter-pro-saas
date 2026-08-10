import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), "utf8");

function assertIncludes(source, value, label) {
  if (!source.includes(value)) throw new Error(`Payment security check failed: ${label}`);
}

function assertNotIncludes(source, value, label) {
  if (source.includes(value)) throw new Error(`Payment security check failed: ${label}`);
}

const actions = read("features/payments/actions.ts");
const page = read("app/(app)/pagamentos-pix/page.tsx");
const migration = read("supabase/migrations/0018_essential_integrations_showcase_payments.sql");

assertIncludes(actions, "encryptSecret", "sensitive payment fields must be encrypted before storage");
assertIncludes(actions, "holder_document_encrypted", "holder document encrypted column must be written");
assertIncludes(actions, "bank_account_encrypted", "bank account encrypted column must be written");
assertIncludes(actions, "pix_key_encrypted", "Pix key encrypted column must be written");
assertIncludes(actions, "holder_document: null", "legacy holder document column must not receive plaintext");
assertIncludes(actions, "bank_account: null", "legacy bank account column must not receive plaintext");
assertIncludes(actions, "pix_key: null", "legacy Pix key column must not receive plaintext");
assertNotIncludes(actions, "console.log", "payment action must not log payment payloads");
assertNotIncludes(actions, "console.error", "payment action must not log sensitive payment errors with payloads");

assertIncludes(page, "decryptSecret", "protected payment page must decrypt server-side only");
assertIncludes(page, "requireOrganizationAccess([\"OWNER\", \"ADMIN\", \"FINANCIAL\"])", "payment page must enforce privileged roles server-side");
assertIncludes(migration, "holder_document_encrypted text", "migration must include encrypted holder document column");
assertIncludes(migration, "bank_account_encrypted text", "migration must include encrypted bank account column");
assertIncludes(migration, "pix_key_encrypted text", "migration must include encrypted Pix key column");
assertIncludes(migration, "array['OWNER','ADMIN','FINANCIAL']", "RLS must restrict payment settings to financial roles");

console.log("Payment security checks passed.");
