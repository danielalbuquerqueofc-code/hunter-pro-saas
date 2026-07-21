import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  const error = url.searchParams.get("error") || url.searchParams.get("error_code");

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/convite-expirado?reason=${encodeURIComponent("Este link expirou ou ja foi utilizado. Solicite um novo acesso.")}`,
        url.origin
      )
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/convite-expirado", url.origin));
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      new URL(
        `/convite-expirado?reason=${encodeURIComponent("Nao foi possivel validar este link. Solicite um novo acesso.")}`,
        url.origin
      )
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
