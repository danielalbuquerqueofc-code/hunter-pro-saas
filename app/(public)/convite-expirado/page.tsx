import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";

type ConviteExpiradoPageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function ConviteExpiradoPage({ searchParams }: ConviteExpiradoPageProps) {
  const query = await searchParams;

  return (
    <AuthCard
      title="Link indisponivel"
      description={query.reason || "Este convite ou link de recuperacao expirou, ja foi usado ou nao pertence a este dominio."}
    >
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
        Solicite um novo convite ao administrador da sua empresa ou envie um link de recuperacao de senha para o seu e-mail.
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link
          href="/recuperar-senha"
          className="flex h-12 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
        >
          Recuperar senha
        </Link>
        <Link
          href="/login"
          className="flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-900 transition hover:bg-slate-50"
        >
          Voltar ao login
        </Link>
      </div>
    </AuthCard>
  );
}
