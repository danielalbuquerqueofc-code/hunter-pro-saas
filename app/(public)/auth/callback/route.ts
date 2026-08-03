import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSafeInternalPath } from "@/lib/safe-redirect";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeInternalPath(url.searchParams.get("next"));
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

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user?.id && user.email) {
    const admin = createAdminClient();
    const { data: invitation } = await admin
      .from("organization_invitations")
      .select("id,organization_id,email,status,expires_at,invited_user_id")
      .or(`invited_user_id.eq.${user.id},email.eq.${user.email.toLowerCase()}`)
      .eq("status", "SENT")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (invitation) {
      if (new Date(invitation.expires_at) <= new Date() || invitation.email.toLowerCase() !== user.email.toLowerCase()) {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          new URL(
            `/convite-expirado?reason=${encodeURIComponent("Este convite expirou ou nao pertence ao e-mail autenticado.")}`,
            url.origin
          )
        );
      }

      const acceptedAt = new Date().toISOString();
      await admin
        .from("organization_members")
        .update({ status: "ACTIVE", accepted_at: acceptedAt })
        .eq("organization_id", invitation.organization_id)
        .eq("user_id", user.id)
        .eq("status", "PENDING");

      await admin
        .from("organization_invitations")
        .update({ status: "ACCEPTED", accepted_at: acceptedAt, invited_user_id: user.id, provider_user_id: user.id })
        .eq("id", invitation.id);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
