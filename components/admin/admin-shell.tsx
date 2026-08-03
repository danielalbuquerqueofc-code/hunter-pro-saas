import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  Building2,
  CreditCard,
  LayoutDashboard,
  Receipt,
  Settings,
  ShieldCheck,
  Users
} from "lucide-react";

const adminItems = [
  { href: "/admin", label: "Visao geral", icon: LayoutDashboard },
  { href: "/admin/empresas", label: "Empresas", icon: Building2 },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/planos", label: "Planos", icon: ShieldCheck },
  { href: "/admin/assinaturas", label: "Assinaturas", icon: Receipt },
  { href: "/admin/pagamentos", label: "Pagamentos", icon: CreditCard },
  { href: "/admin/atividades", label: "Atividades", icon: Activity },
  { href: "/admin/configuracoes", label: "Configuracoes", icon: Settings }
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-zinc-950 p-5 text-white lg:block">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 font-black text-zinc-950">
            HP
          </span>
          <span>
            <strong className="block text-lg">Hunter Pro</strong>
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">Painel Master</span>
          </span>
        </Link>

        <nav className="mt-8 space-y-2">
          {adminItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              <item.icon className="h-4 w-4 text-emerald-400" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-zinc-400">
          Acesso restrito ao SUPER_ADMIN. Todas as acoes sensiveis devem gerar auditoria.
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-5 py-4 backdrop-blur lg:hidden">
          <Link href="/admin" className="font-black">Hunter Master</Link>
          <Link href="/dashboard" className="rounded-full bg-zinc-950 px-4 py-2 text-xs font-black text-white">Sair</Link>
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
          {adminItems.map((item) => (
            <Link key={item.href} href={item.href} className="shrink-0 rounded-full bg-zinc-100 px-4 py-2 text-xs font-black">
              {item.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-zinc-200 bg-white px-5 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div>
        {eyebrow ? <p className="text-xs font-black uppercase tracking-wide text-emerald-600">{eyebrow}</p> : null}
        <h1 className="text-3xl font-black text-zinc-950">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm font-semibold text-zinc-500">{description}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function AdminMetricCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-zinc-950">{value}</p>
      {hint ? <p className="mt-2 text-xs font-bold uppercase tracking-wide text-zinc-400">{hint}</p> : null}
    </div>
  );
}

export function AdminSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-zinc-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
