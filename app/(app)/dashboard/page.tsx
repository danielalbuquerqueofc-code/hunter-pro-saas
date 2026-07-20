import Link from "next/link";
import {
  Banknote,
  Building2,
  CalendarDays,
  CircleDollarSign,
  Goal,
  TrendingUp,
  Users,
  WalletCards
} from "lucide-react";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { AiAlerts } from "@/components/dashboard/ai-alerts";
import { DashboardCalendar } from "@/components/dashboard/dashboard-calendar";
import { FinancialSummary } from "@/components/dashboard/financial-summary";
import { MetricCard } from "@/components/dashboard/metric-card";
import { OnboardingModal } from "@/components/dashboard/onboarding-modal";
import { PipelineSummary } from "@/components/dashboard/pipeline-summary";
import { SalesSummary } from "@/components/dashboard/sales-summary";
import { SetupChecklist } from "@/components/dashboard/setup-checklist";
import { TaskList } from "@/components/dashboard/task-list";
import { TodayAppointments } from "@/components/dashboard/today-appointments";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { getDashboardData } from "@/features/dashboard/queries";
import { getOnboardingProgress, getSetupChecklist } from "@/features/onboarding/queries";
import { requireUser } from "@/lib/auth";

type MetricTrend = "positive" | "negative" | "neutral";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "bom dia";
  }

  if (hour < 18) {
    return "boa tarde";
  }

  return "boa noite";
}

function getFormattedDate() {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    weekday: "long"
  }).format(new Date());
}

export default async function DashboardPage() {
  const user = await requireUser();
  const dashboard = await getDashboardData(user.id);

  if (!dashboard.organization) {
    return (
      <section className="mx-auto max-w-3xl p-8">
        <EmptyState
          icon={Building2}
          title="Crie sua primeira empresa"
          description="Para ativar o painel, cadastre a empresa que sera dona dos dados, usuarios, agenda, CRM, financeiro e vitrine."
          action={
            <Button asChild>
              <Link href="/configuracoes">Cadastrar empresa</Link>
            </Button>
          }
        />
      </section>
    );
  }

  const name = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "admin";
  const operations = dashboard.operations;
  const [onboardingProgress, setupItems] = await Promise.all([
    getOnboardingProgress(dashboard.organization.id, user.id),
    getSetupChecklist(dashboard.organization.id)
  ]);
  const quickActions = [
    { href: "/crm", label: "Novo contato", icon: Users },
    { href: "/agenda", label: "Novo horario", icon: CalendarDays },
    { href: "/servicos", label: "Novo servico", icon: Goal },
    { href: "/financeiro", label: "Nova transacao", icon: WalletCards }
  ];
  const paidByMethod = Object.entries(operations?.paidByMethod ?? {}).map(([label, value], index) => ({
    label,
    value,
    color: ["#38bdf8", "#22c55e", "#f59e0b", "#ef4444", "#94a3b8", "#111827"][index % 6]
  }));
  const appointmentDays = Array.from(
    new Set((operations?.upcomingAppointments ?? []).map((appointment) => new Date(appointment.starts_at).getDate()))
  );
  const aiAlerts =
    operations?.aiAgents.length
      ? ["IA SDR configurada. Monitore execucoes antes de liberar automacoes externas."]
      : ["IA SDR ainda sem agente ativo. Configure em IA antes de automatizar atendimento."];
  const balanceTrend: MetricTrend = (operations?.financial.balance ?? 0) >= 0 ? "positive" : "negative";
  const overdueTrend: MetricTrend = operations?.overdueTasks ? "negative" : "positive";
  const dashboardMetrics = [
    {
      title: "Recebido",
      value: formatCurrency(operations?.financial.paidIncome ?? 0),
      comparison: "receitas pagas registradas",
      trend: "neutral" as const,
      href: "/financeiro",
      icon: CircleDollarSign
    },
    {
      title: "Saldo atual",
      value: formatCurrency(operations?.financial.balance ?? 0),
      comparison: "entradas menos saidas pagas",
      trend: balanceTrend,
      href: "/financeiro",
      icon: WalletCards
    },
    {
      title: "Agendamentos hoje",
      value: String(operations?.appointmentsToday.length ?? 0),
      comparison: "agenda real do dia",
      trend: "neutral" as const,
      href: "/agenda",
      icon: CalendarDays
    },
    {
      title: "Novos contatos",
      value: String(operations?.contactsThisMonth ?? 0),
      comparison: "criados neste mes",
      trend: "neutral" as const,
      href: "/crm",
      icon: Users
    },
    {
      title: "Oportunidades abertas",
      value: String(operations?.openDeals.length ?? 0),
      comparison: "negocios em andamento",
      trend: "neutral" as const,
      href: "/crm",
      icon: Goal
    },
    {
      title: "A receber",
      value: formatCurrency(operations?.financial.pendingReceivable ?? 0),
      comparison: "receitas pendentes",
      trend: "neutral" as const,
      href: "/financeiro",
      icon: Banknote
    },
    {
      title: "Tarefas atrasadas",
      value: String(operations?.overdueTasks ?? 0),
      comparison: "pendencias vencidas",
      trend: overdueTrend,
      href: "/tarefas",
      icon: TrendingUp
    },
    {
      title: "Taxa de conversao",
      value: `${operations?.conversionRate ?? 0}%`,
      comparison: "ganhos sobre fechados",
      trend: "neutral" as const,
      href: "/relatorios",
      icon: TrendingUp
    }
  ];

  return (
    <section className="px-5 py-7 lg:px-8">
      <OnboardingModal
        initialDismissed={Boolean(
          onboardingProgress?.dismissed || onboardingProgress?.onboarding_completed_at
        )}
        initialStep={onboardingProgress?.current_step ?? 0}
      />

      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-brand-orange">
            {dashboard.organization.name} - {dashboard.stats.status}
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight lg:text-3xl">
            Ola, {name}. Veja como esta sua operacao hoje.
          </h1>
          <p className="mt-1 text-sm font-medium text-zinc-600">
            Hoje e {getFormattedDate()}. Status da conta: {dashboard.stats.activePlan}.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-400 px-5 text-sm font-black text-white shadow-sm hover:bg-emerald-500"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-orange-100 bg-white p-4 shadow-sm">
        <p className="text-sm font-bold text-zinc-700">
          {getGreeting()}, sua central de comando esta pronta. Complete o checklist para liberar a melhor experiencia do Hunter Pro.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.35fr_1fr]">
        <DashboardCalendar appointmentDays={appointmentDays} />
        <SalesSummary items={paidByMethod} paidIncome={operations?.financial.paidIncome ?? 0} />
        <FinancialSummary summary={operations?.financial ?? {
          paidIncome: 0,
          paidExpense: 0,
          pendingReceivable: 0,
          pendingPayable: 0,
          balance: 0
        }} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_420px]">
        <TodayAppointments appointments={operations?.appointmentsToday ?? []} />
        <PipelineSummary items={operations?.pipeline ?? []} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
        <SetupChecklist items={setupItems} />
        <AiAlerts alerts={aiAlerts} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
        <ActivityFeed items={operations?.activities ?? []} />
        <TaskList tasks={operations?.tasks ?? []} />
      </div>
    </section>
  );
}
