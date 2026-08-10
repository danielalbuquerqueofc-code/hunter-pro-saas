import { NextResponse } from "next/server";
import { buildGoogleCalendarAuthUrl } from "@/features/integrations/google-calendar";
import { getCurrentOrganization } from "@/features/organizations/current";
import { requireUser } from "@/lib/auth";
import { env } from "@/lib/env";

const ALLOWED_ROLES = new Set(["OWNER", "ADMIN", "MANAGER", "SUPER_ADMIN"]);

export async function GET() {
  const user = await requireUser();
  const current = await getCurrentOrganization(user.id);

  if (!current.organization || !current.role || !ALLOWED_ROLES.has(current.role)) {
    return NextResponse.redirect(new URL("/integracoes?error=sem-permissao", env.appUrl));
  }

  try {
    const url = buildGoogleCalendarAuthUrl(current.organization.id, user.id);
    return NextResponse.redirect(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel iniciar o Google Calendar.";
    return NextResponse.redirect(new URL(`/integracoes?error=${encodeURIComponent(message)}`, env.appUrl));
  }
}
