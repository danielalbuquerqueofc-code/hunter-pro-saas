import { NextResponse } from "next/server";
import {
  decodeGoogleState,
  exchangeGoogleCalendarCode,
  upsertGoogleCalendarConnection
} from "@/features/integrations/google-calendar";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/integracoes?error=${encodeURIComponent("Google nao autorizado.")}`, env.appUrl));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL(`/integracoes?error=${encodeURIComponent("Retorno do Google incompleto.")}`, env.appUrl));
  }

  const decoded = decodeGoogleState(state);
  if (!decoded) {
    return NextResponse.redirect(new URL(`/integracoes?error=${encodeURIComponent("Sessao de conexao Google expirada.")}`, env.appUrl));
  }

  try {
    const tokens = await exchangeGoogleCalendarCode(code);
    await upsertGoogleCalendarConnection({
      organizationId: decoded.organizationId,
      userId: decoded.userId,
      tokens
    });

    return NextResponse.redirect(new URL("/integracoes?success=google-calendar", env.appUrl));
  } catch (exception) {
    const message = exception instanceof Error ? exception.message : "Nao foi possivel conectar o Google Calendar.";
    return NextResponse.redirect(new URL(`/integracoes?error=${encodeURIComponent(message)}`, env.appUrl));
  }
}
