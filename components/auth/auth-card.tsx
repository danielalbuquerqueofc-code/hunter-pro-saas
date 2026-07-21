import type { ReactNode } from "react";
import Link from "next/link";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dcfce7,transparent_32%),linear-gradient(135deg,#f8fafc,#eef2f7)] px-4 py-8 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/88 shadow-2xl shadow-slate-900/12 backdrop-blur-xl lg:grid-cols-[1fr_460px]">
          <div className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-lg font-black text-slate-950">HP</span>
              <span>
                <strong className="block text-xl">Hunter Pro</strong>
                <span className="text-sm font-semibold text-white/58">Agenda, vitrine e gestao simples.</span>
              </span>
            </Link>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">Acesso seguro</p>
              <h1 className="mt-4 max-w-xl text-5xl font-black leading-tight">
                Entre no painel que organiza seu atendimento.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-white/68">
                Gerencie agenda, clientes, vitrine digital, financeiro simples e automacoes em uma experiencia criada para prestadores de servico.
              </p>
            </div>
            <p className="text-xs font-bold text-white/42">Hunter Pro - Plataforma SaaS</p>
          </div>

          <div className="p-5 sm:p-8 lg:p-10">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-base font-black text-slate-950">HP</span>
              <span>
                <strong className="block">Hunter Pro</strong>
                <span className="text-xs font-bold text-slate-500">Plataforma SaaS</span>
              </span>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Conta Hunter Pro</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            <div className="mt-7">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
