import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(file) {
  return readFileSync(path.join(root, file), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`critical-fixes: ${message}`);
    process.exit(1);
  }
}

function assertIncludes(content, expected, message) {
  assert(content.includes(expected), message);
}

function assertNotIncludes(content, forbidden, message) {
  assert(!content.includes(forbidden), message);
}

const dashboard = read("app/(app)/dashboard/page.tsx");
assertIncludes(dashboard, '.from("profiles")', "dashboard must read profile data");
assertIncludes(dashboard, "profile?.full_name", "dashboard greeting must prefer profiles.full_name");

const accountActions = read("features/account/actions.ts");
assertIncludes(accountActions, "supabase.auth.updateUser", "account update must sync auth metadata");
assertIncludes(accountActions, 'revalidatePath("/dashboard")', "account update must refresh dashboard");

const userActions = read("features/users/actions.ts");
assertIncludes(userActions, "/auth/callback?next=/definir-senha", "invite redirect must use the Supabase callback");
assertIncludes(userActions, "env.appUrl", "invite redirect must use the configured production URL");
assertIncludes(userActions, 'status: "PENDING"', "invited members must stay pending until the callback accepts the invitation");
assertNotIncludes(userActions, 'status: "ACTIVE",\n      invited_by: user.id', "invite action must not create active members before acceptance");

const authActions = read("features/auth/actions.ts");
assertIncludes(authActions, "requestPasswordRecoveryAction", "password recovery action must exist");
assertIncludes(authActions, "definePasswordAction", "define password action must exist");
assertIncludes(authActions, "/auth/callback?next=/definir-senha", "password recovery must use the callback route");
assertIncludes(authActions, "getSafeInternalPath", "login must validate next redirects");
assertIncludes(authActions, "redirect(next)", "login must redirect to the validated next path");

const stripeWebhook = read("app/api/webhooks/stripe/route.ts");
assertIncludes(stripeWebhook, "mapSubscriptionToAccessStatus", "stripe webhook must use the shared access status mapping");
assertNotIncludes(stripeWebhook, "overdue", "stripe webhook must not write unsupported overdue access status");

const accessControl = read("features/organizations/access-control.ts");
assertIncludes(accessControl, 'organization.subscription_status === "PAST_DUE"', "past due subscriptions must block access");

const proxy = read("proxy.ts");
assertIncludes(proxy, "status: 503", "private routes must fail closed when Supabase env is missing");
assertIncludes(proxy, "Hunter Pro proxy misconfigured", "proxy must log a safe server-side configuration error");

assert(existsSync(path.join(root, "app/(public)/auth/callback/route.ts")), "Supabase auth callback route must exist");
const callback = read("app/(public)/auth/callback/route.ts");
assertIncludes(callback, 'status: "ACTIVE"', "callback must activate pending members after a valid invite login");
assertIncludes(callback, 'status", "PENDING"', "callback must only activate pending members");
assert(existsSync(path.join(root, "app/(public)/definir-senha/page.tsx")), "define password page must exist");
assert(existsSync(path.join(root, "app/(public)/recuperar-senha/page.tsx")), "password recovery page must exist");
assert(existsSync(path.join(root, "app/manifest.ts")), "PWA manifest route must exist");
assert(existsSync(path.join(root, "public/sw.js")), "service worker must exist");
assert(existsSync(path.join(root, "public/icons/icon-192.png")), "PWA 192 icon must exist");
assert(existsSync(path.join(root, "public/icons/icon-512.png")), "PWA 512 icon must exist");

const layout = read("app/layout.tsx");
assertIncludes(layout, 'manifest: "/manifest.webmanifest"', "metadata must expose the PWA manifest");
assertIncludes(layout, "<PwaRegister />", "layout must register the PWA helper");

const theme = read("features/showcase/theme.ts");
assertIncludes(theme, "--store-primary-foreground", "showcase theme must expose safe button text token");
assertIncludes(theme, "readableText(primary)", "showcase theme must calculate readable button text");

const studio = read("components/showcase/showcase-studio.tsx");
assertIncludes(studio, 'name="primaryColor" value=""', "showcase studio must clear legacy manual primary color on save");
assertIncludes(studio, "resolveShowcaseTheme({ theme_key: themeKey, font_key: fontKey })", "showcase preview must apply selected theme");

const publicShowcase = read("app/(public)/p/[slug]/page.tsx");
assertIncludes(publicShowcase, "https://prospectoads.com", "public showcase canonical fallback must use the final domain");
assertNotIncludes(publicShowcase, "prospectorads.com", "public showcase must not use the old misspelled domain");

const publishGuide = read("PUBLICAR_AGORA.md");
assertNotIncludes(publishGuide, "danielalbuquerque.com.br", "publish guide must not point to the old personal domain");
assertIncludes(publishGuide, "prospectoads.com", "publish guide must point to the final domain");

console.log("critical-fixes: ok");
