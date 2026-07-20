import { Banknote } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

type PaymentItem = {
  label: string;
  value: number;
  color: string;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function SalesSummary({ items, paidIncome }: { items: PaymentItem[]; paidIncome: number }) {
  const chartItems = items.length > 0 ? items : [{ label: "Sem vendas", value: 0, color: "#94a3b8" }];
  const maxValue = Math.max(...chartItems.map((item) => item.value), 1);

  return (
    <DashboardSection
      title="Resumo de vendas"
      description="Valores separados por forma de pagamento"
      action={<span className="text-sm font-black text-emerald-600">{formatCurrency(paidIncome)} pagos</span>}
    >
      <div className="mb-4 flex flex-wrap gap-5 text-xs font-bold">
        {chartItems.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rotate-45" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
      <div className="relative h-56 overflow-hidden border-b border-dashed border-slate-300">
        {[12000, 10000, 8000, 6000, 4000, 2000, 0].map((amount, index) => (
          <div
            key={amount}
            className="absolute left-0 right-0 border-t border-dashed border-slate-300 text-xs text-slate-400"
            style={{ top: `${index * 16}%` }}
          >
            R$ {amount.toLocaleString("pt-BR")},00
          </div>
        ))}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around gap-3">
          {chartItems.map((item) => (
            <div
              key={item.label}
              className="flex w-full max-w-16 justify-center rounded-t-md bg-gradient-to-t from-[#8d2f1d] to-brand-orange"
              style={{ height: `${Math.max(10, Math.round((item.value / maxValue) * 90))}%` }}
              aria-label={`Vendas ${item.label}`}
            >
              <Banknote className="mt-2 h-4 w-4 text-white/80" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black sm:grid-cols-3 lg:grid-cols-6">
        {chartItems.map((item) => (
          <span key={item.label} style={{ color: item.color }}>
            {formatCurrency(item.value)}
          </span>
        ))}
      </div>
    </DashboardSection>
  );
}
