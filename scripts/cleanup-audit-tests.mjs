import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(file) {
  return readFileSync(path.join(root, file), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`cleanup-audit: ${message}`);
    process.exit(1);
  }
}

const pkg = JSON.parse(read("package.json"));
assert(!pkg.dependencies?.["react-hook-form"], "react-hook-form must stay removed until it is actually used");
assert(!pkg.dependencies?.["@hookform/resolvers"], "@hookform/resolvers must stay removed until it is actually used");

assert(!existsSync(path.join(root, "components/layout/app-sidebar.tsx")), "legacy layout sidebar must stay removed");
assert(!existsSync(path.join(root, "features/showcase/showcase-forms.tsx")), "legacy showcase forms must stay removed");

const clientesPage = read("app/(app)/clientes/page.tsx");
assert(clientesPage.includes("searchParams"), "clientes page must accept search params");
assert(clientesPage.includes('name="q"'), "clientes search input must submit q");
assert(clientesPage.includes("filter === \"Recentes\" && index < 10"), "clientes recent filter must be deterministic");
assert(!clientesPage.includes("Date.now()"), "clientes page must not call Date.now during render");

const globalSearch = read("components/shell/global-search.tsx");
assert(globalSearch.includes('action="/clientes"'), "global search must point to the clientes search page");
assert(!globalSearch.includes("CRM atual"), "global search must not use outdated CRM wording");

const notifications = read("components/shell/notification-center.tsx");
assert(!notifications.includes("absolute right-2 top-2"), "notification center must not show a fake unread dot");

const studio = read("components/showcase/showcase-studio.tsx");
assert(studio.includes("SocialPreviewLink"), "showcase studio must render safe social preview links");
assert(!studio.includes('href={instagramUrl || "#"}'), "showcase studio must not create fake Instagram links");
assert(!studio.includes('href={youtubeUrl || "#"}'), "showcase studio must not create fake YouTube links");

console.log("cleanup-audit: ok");
