import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function assertIncludes(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`Public showcase check failed: ${label}`);
  }
}

const page = read("app/(public)/p/[slug]/page.tsx");
const companyAlias = read("app/(public)/p/[slug]/company/page.tsx");
const storefront = read("features/showcase/public-storefront.tsx");
const queries = read("features/showcase/queries.ts");
const theme = read("features/showcase/theme.ts");

assertIncludes(page, "generateMetadata", "dynamic SEO metadata");
assertIncludes(page, "PublicStorefront", "public storefront component is used by route");
assertIncludes(companyAlias, "PublicShowcasePage", "legacy /company public route remains available");
assertIncludes(queries, "availability_rules", "public availability rules are loaded");
assertIncludes(queries, "get_public_busy_times", "busy times are loaded through safe public RPC");
assertIncludes(queries, "kind === \"blocked\"", "blocked times are filtered from safe busy times");
assertIncludes(queries, "kind === \"appointment\"", "busy appointments are filtered from safe busy times");
assertIncludes(theme, "resolveShowcaseTheme", "safe theme resolver exists");
assertIncludes(theme, "contrastRatio", "contrast protection exists");
assertIncludes(storefront, "Etapa {step} de 4", "booking flow is step-based");
assertIncludes(storefront, "onClick={() => openBooking(service.id)}", "service cards preselect booking service");
assertIncludes(storefront, "safe-area-inset-bottom", "mobile bottom navigation respects safe area");
assertIncludes(storefront, "Sob consulta", "undefined zero price is not shown as promotional value");
assertIncludes(storefront, "navigator.share", "share action exists");

console.log("Public showcase checks passed.");
