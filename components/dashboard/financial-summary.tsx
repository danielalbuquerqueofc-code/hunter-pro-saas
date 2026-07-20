import { Check, TrendingDown, TrendingUp } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

type FinancialSummaryProps = {
  summary: {
    paidIncome: number;
    paidExpense: number;
    pendingReceivable: number;
    pendingPayable: number;
    balance: number;
  };
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function FinancialSummary({ summary }: FinancialSummaryProps) {
  return (
    <DashboardSection
      title="Resumo financeiro"
      description="Entradas, saidas e contas"
      action={
        <span className="inline-flex items-center gap-1 text-sm font-black text-emerald-600">
          {formatCurrency(summary.balance)} de saldo <Check className="h-4 w-4" />
        </span>
      }
    >
      <div className="grid min-h-40 grid-cols-2 overflow-hidden rounded-lg border border-zinc-100">
        <div className="flex flex-col items-center justify-center bg-emerald-50 p-5 text-center">
          <h3 className="font-bold">Entradas hoje</h3>
          <p className="mt-2 text-xs leading-relaxed text-zinc-600">Total de receitas lancadas no dia</p>
          <p className="mt-6 inline-flex items-center gap-1 text-2xl font-black text-emerald-500">
            <TrendingUp className="h-5 w-5" />
            {formatCurrency(summary.paidIncome)}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center bg-red-50 p-5 text-center">
          <h3 className="font-bold">Saidas hoje</h3>
          <p className="mt-2 text-xs leading-relaxed text-zinc-600">Total de despesas lancadas no dia</p>
          <p className="mt-6 inline-flex items-center gap-1 text-2xl font-black text-red-500">
            <TrendingDown className="h-5 w-5" />
            {formatCurrency(summary.paidExpense)}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <FinancialTile label="Contas vencidas" value="0" tone="red" />
        <FinancialTile label="A receber" value={formatCurrency(summary.pendingReceivable)} tone="emerald" />
        <FinancialTile label="A pagar" value={formatCurrency(summary.pendingPayable)} tone="amber" />
      </div>
    </DashboardSection>
  );
}

function FinancialTile({ label, value, tone }: { label: string; value: string; tone: "red" | "emerald" | "amber" }) {
  const classes = {
    red: "bg-red-50 text-red-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600"
  };

  return (
    <div className={`rounded-lg p-4 ${classes[tone]}`}>
      <p className="text-xs font-black uppercase">{label}</p>
      <strong className="mt-2 block text-xl">{value}</strong>
    </div>
  );
}
