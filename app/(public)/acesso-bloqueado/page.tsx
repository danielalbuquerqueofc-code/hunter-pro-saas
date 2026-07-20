import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { signOutAction } from "@/features/auth/actions";
import { getCurrentOrganization } from "@/features/organizations/current";
import { getOrganizationAccessState } from "@/features/organizations/access-control";
import { requireUser } from "@/lib/auth";

export default async function AcessoBloqueadoPage() {
  const user = await requireUser();
  const current = await getCurrentOrganization(user.id);
  const access = current.organization ? getOrganizationAccessState(current.organization) : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <section className="w-full max-w-xl rounded-[28px] border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <LockKeyhole className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="mt-6 text-sm font-bold uppercase tracking-wide text-zinc-500">
          Hunter Pro
        </p>
        <h1 className="mt-2 text-3xl font-black text-zinc-950">
          Acesso temporariamente bloqueado
        </h1>
        <p className="mt-3 text-base leading-7 text-zinc-600">
          {access?.reason ??
            "Nao encontramos uma empresa ativa para este acesso. Fale com o suporte para liberar o painel."}
        </p>

        {access?.trialEndsAt ? (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
            <strong className="text-zinc-950">Fim do teste:</strong>{" "}
            {new Intl.DateTimeFormat("pt-BR", {
              dateStyle: "long",
              timeStyle: "short"
            }).format(new Date(access.trialEndsAt))}
          </div>
        ) : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href="/precos"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-orange px-5 text-sm font-bold text-white transition hover:bg-orange-600"
          >
            Ver planos
          </Link>
          <a
            href="mailto:suporte@hunterpro.app?subject=Liberar%20acesso%20Hunter%20Pro"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-900 transition hover:bg-zinc-50"
          >
            Falar com suporte
          </a>
        </div>

        <form action={signOutAction} className="mt-4">
          <button className="h-11 w-full rounded-xl bg-zinc-100 text-sm font-bold text-zinc-700 transition hover:bg-zinc-200">
            Sair desta conta
          </button>
        </form>
      </section>
    </main>
  );
}
