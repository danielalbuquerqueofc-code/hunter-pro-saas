import Link from "next/link";
import {
  CalendarDays,
  CircleDollarSign,
  Clock3,
  MessageCircle,
  Plus,
  Share2,
  Sparkles,
  Store,
  UserPlus,
  WalletCards
} from "lucide-react";
import { OnboardingModal } from "@/components/dashboard/onboarding-modal";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { getDashboardData } from "@/features/dashboard/queries";
import { getOnboardingProgress } from "@/features/onboarding/queries";
import { requireUser } from "@/lib/auth";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function getGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat("pt-BR", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Sao_Paulo"
    }).format(new Date())
  );
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function getDateLabel() {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    weekday: "long",
    timeZone: "America/Sao_Paulo"
  }).format(new Date());
}

export default async function DashboardPage() {
  const user = await requireUser();
  const dashboard = await getDashboardData(user.id);

  if (!dashboard.organization) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-10">
        <EmptyState
          icon={Store}
          title="Crie sua primeira empresa"
          description="Ative seu espaco para gerenciar agenda, clientes, financeiro e vitrine digital."
          action={
            <Button asChild>
              <Link href="/configuracoes">Cadastrar empresa</Link>
            </Button>
          }
        />
      </section>
    );
  }

  const operations = dashboard.operations;
  const name = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "admin";
  const onboardingProgress = await getOnboardingProgress(dashboard.organization.id, user.id);
  const upcoming = operations?.upcomingAppointments.slice(0, 3) ?? [];
  const today = operations?.appointmentsToday ?? [];
  const pendingReceivable = operations?.financial.pendingReceivable ?? 0;
  const balance = operations?.financial.balance ?? 0;
  const pendingTasks = operations?.tasks.filter((task) => task.status !== "DONE").slice(0, 3) ?? [];
  const publicUrl = `/p/${dashboard.organization.slug}`;
  const quickActions = [
    { href: "/agenda", label: "Novo agendamento", icon: Plus, tone: "bg-[var(--hp-accent)] text-[#04100a] shadow-emerald-500/20" },
    { href: "/clientes", label: "Novo cliente", icon: UserPlus, tone: "bg-white text-slate-950 ring-1 ring-slate-200" },
    { href: "/vitrine", label: "Editar vitrine", icon: Store, tone: "bg-white text-slate-950 ring-1 ring-slate-200" },
    { href: publicUrl, label: "Abrir vitrine", icon: Share2, tone: "bg-white text-slate-950 ring-1 ring-slate-200" }
  ];

  return (
    <section className="mx-auto grid max-w-6xl gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <OnboardingModal
        initialDismissed={Boolean(onboardingProgress?.dismissed || onboardingProgress?.onboarding_completed_at)}
        initialStep={onboardingProgress?.current_step ?? 0}
      />

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/10 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">{getDateLabel()}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">
              {getGreeting()}, {name}! <span className="text-[var(--hp-accent)]">Tudo simples.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              Aqui esta o que merece sua atencao hoje em {dashboard.organization.name}.
            </p>
          </div>
          <Link
            href="/ia"
            className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 p-4 text-[var(--hp-accent)] sm:block"
            aria-label="Abrir assistente"
          >
            <Sparkles className="h-6 w-6" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <CalendarDays className="h-6 w-6 text-[var(--hp-accent)]" />
            <p className="mt-4 text-3xl font-black">{today.length}</p>
            <p className="text-sm font-semibold text-slate-600">Agendamentos hoje</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <WalletCards className="h-6 w-6 text-[var(--hp-accent)]" />
            <p className="mt-4 text-3xl font-black">{formatCurrency(balance)}</p>
            <p className="text-sm font-semibold text-slate-600">Saldo simples</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <CircleDollarSign className="h-6 w-6 text-amber-500" />
            <p className="mt-4 text-3xl font-black">{formatCurrency(pendingReceivable)}</p>
            <p className="text-sm font-semibold text-slate-600">A receber</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <MessageCircle className="h-6 w-6 text-sky-500" />
            <p className="mt-4 text-3xl font-black">{operations?.contactsThisMonth ?? 0}</p>
            <p className="text-sm font-semibold text-slate-600">Novos contatos</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="hp-card rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-[var(--hp-accent)]">Proximos horarios</p>
              <h2 className="mt-1 text-2xl font-black">Agenda do dia</h2>
            </div>
            <Link href="/agenda" className="text-sm font-bold text-slate-600 hover:text-slate-950">Ver agenda</Link>
          </div>

          <div className="mt-5 grid gap-3">
            {upcoming.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-6 text-slate-500">
                Nenhum agendamento futuro encontrado.
              </div>
            ) : (
              upcoming.map((appointment) => (
                <Link
                  href="/agenda"
                  key={appointment.id}
                  className="group flex items-center gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--hp-accent-soft)] font-black text-[var(--hp-accent)]">
                    {formatTime(appointment.starts_at)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-black">{appointment.customer_name}</p>
                    <p className="truncate text-sm text-slate-500">{appointment.service?.name ?? "Servico nao informado"}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {appointment.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="hp-card rounded-[2rem] p-5 sm:p-6">
          <p className="text-sm font-black uppercase tracking-wide text-[var(--hp-accent)]">Acoes rapidas</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`min-h-36 rounded-[1.5rem] p-4 text-center font-black shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl ${action.tone}`}
              >
                <action.icon className="mx-auto mb-3 h-6 w-6" />
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="hp-card rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black">Pendencias leves</h2>
            <Clock3 className="h-6 w-6 text-zinc-400" />
          </div>
          <div className="mt-5 grid gap-3">
            {pendingTasks.length === 0 ? (
              <p className="text-slate-500">Nada urgente agora. O dia esta limpo.</p>
            ) : (
              pendingTasks.map((task) => (
                <Link key={task.id} href="/tarefas" className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-bold">{task.title}</p>
                  <p className="mt-1 text-sm text-zinc-500">{task.priority} · {task.status}</p>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-emerald-400/20 bg-[var(--hp-accent-soft)] p-5 sm:p-6">
          <Store className="h-8 w-8 text-[var(--hp-accent)]" />
          <h2 className="mt-4 text-2xl font-black">Sua vitrine esta pronta para vender</h2>
          <p className="mt-2 text-slate-600">
            Atualize servicos, fotos, links e compartilhe seu endereco publico com QR Code.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/vitrine" className="rounded-full bg-[var(--hp-accent)] px-5 py-3 font-black text-[#04100a]">
              Editar vitrine
            </Link>
            <Link href={publicUrl} className="rounded-full border border-slate-300 bg-white px-5 py-3 font-black text-slate-950">
              Abrir pagina
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
