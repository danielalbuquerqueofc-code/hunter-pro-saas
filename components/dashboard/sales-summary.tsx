import { Banknote } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { paymentSummary } from "@/features/dashboard/mock";

export function SalesSummary() {
  return (
    <DashboardSection
      title="Resumo de vendas"
      description="Valores separados por forma de pagamento"
      action={<span className="text-sm font-black text-emerald-600">R$ 0,00 pagos esse mes</span>}
    >
      <div className="mb-4 flex flex-wrap gap-5 text-xs font-bold">
        {paymentSummary.map((item) => (
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
          {[18, 28, 40, 52, 65, 78].map((height, index) => (
            <div
              key={height}
              className="flex w-full max-w-16 justify-center rounded-t-md bg-gradient-to-t from-[#8d2f1d] to-brand-orange"
              style={{ height: `${height}%` }}
              aria-label={`Vendas ${index + 1}`}
            >
              <Banknote className="mt-2 h-4 w-4 text-white/80" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black sm:grid-cols-3 lg:grid-cols-6">
        {paymentSummary.map((item) => (
          <span key={item.label} style={{ color: item.color }}>
            {item.value}
          </span>
        ))}
      </div>
    </DashboardSection>
  );
}
