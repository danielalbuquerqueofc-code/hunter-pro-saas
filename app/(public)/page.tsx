import Link from "next/link";
import { ArrowRight, Calendar, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-brand-ink text-white">
      <section className="mx-auto grid min-h-screen max-w-7xl gap-10 px-6 py-8 lg:grid-cols-[1fr_440px] lg:items-center">
        <div>
          <div className="mb-10 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-orange font-black">
              HP
            </span>
            <span>
              <strong className="block">Hunter Pro</strong>
              <span className="text-sm text-zinc-400">Sistema SaaS multiempresa</span>
            </span>
          </div>

          <p className="mb-4 text-sm font-bold uppercase tracking-wide text-brand-orange">
            Fase 1 pronta para escalar
          </p>
          <h1 className="max-w-3xl text-5xl font-black leading-tight md:text-7xl">
            Painel comercial com empresas isoladas e acesso seguro.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
            A primeira base do Hunter Pro ja nasce com login, cadastro de empresa,
            permissoes, Supabase, RLS e dashboard inicial.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/cadastro">
                Criar minha conta
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/login">Entrar</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            { icon: ShieldCheck, title: "Multiempresa", text: "Dados separados por organizacao." },
            { icon: Calendar, title: "Agenda preparada", text: "Base pronta para a fase de agendamentos." },
            { icon: LayoutDashboard, title: "Dashboard", text: "Indicadores iniciais da empresa." }
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-white/10 bg-white/5 p-6">
              <item.icon className="mb-5 h-6 w-6 text-brand-orange" />
              <h2 className="text-xl font-bold">{item.title}</h2>
              <p className="mt-2 text-zinc-400">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
