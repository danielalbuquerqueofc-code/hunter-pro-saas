import { ArrowDownLeft, ArrowUpRight, CircleDollarSign, CreditCard, WalletCards } from "lucide-react";
import { FinanceForms } from "@/features/finance/finance-forms";
import { getFinanceData } from "@/features/finance/queries";
import { requireOrganizationAccess } from "@/features/organizations/guards";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default async function FinanceiroPage() {
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "FINANCIAL"]);
  const { categories, transactions } = await getFinanceData(organization.id);
  const active = transactions.filter((item) => item.status !== "CANCELED");
  const income = active
    .filter((item) => item.type === "INCOME")
    .reduce((sum, item) => sum + Number(item.amount_cents ?? 0), 0);
  const expense = active
    .filter((item) => item.type === "EXPENSE")
    .reduce((sum, item) => sum + Number(item.amount_cents ?? 0), 0);
  const receivable = transactions
    .filter((item) => item.type === "INCOME" && item.status === "PENDING")
    .reduce((sum, item) => sum + Number(item.amount_cents ?? 0), 0);

  return (
    <section className="mx-auto grid max-w-6xl gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-black uppercase tracking-wide text-[var(--hp-accent)]">{organization.name}</p>
        <h1 className="mt-1 text-4xl font-black tracking-tight">Financeiro</h1>
        <p className="mt-2 text-zinc-400">O basico para saber quanto entrou, saiu e falta receber.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-[2rem] bg-[var(--hp-accent)] p-5 text-[#04100a]">
          <WalletCards className="h-7 w-7" />
          <p className="mt-5 text-sm font-black uppercase">Saldo</p>
          <p className="mt-1 text-3xl font-black">{formatCurrency(income - expense)}</p>
        </div>
        <div className="hp-card rounded-[2rem] p-5">
          <ArrowUpRight className="h-7 w-7 text-[var(--hp-accent)]" />
          <p className="mt-5 text-sm font-black uppercase text-zinc-500">Receitas</p>
          <p className="mt-1 text-3xl font-black">{formatCurrency(income)}</p>
        </div>
        <div className="hp-card rounded-[2rem] p-5">
          <ArrowDownLeft className="h-7 w-7 text-red-300" />
          <p className="mt-5 text-sm font-black uppercase text-zinc-500">Despesas</p>
          <p className="mt-1 text-3xl font-black">{formatCurrency(expense)}</p>
        </div>
        <div className="hp-card rounded-[2rem] p-5">
          <CreditCard className="h-7 w-7 text-amber-300" />
          <p className="mt-5 text-sm font-black uppercase text-zinc-500">Cobranças</p>
          <p className="mt-1 text-3xl font-black">{formatCurrency(receivable)}</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <div className="hp-card rounded-[2rem] p-5">
          <h2 className="text-2xl font-black">Novo lançamento</h2>
          <p className="mt-1 text-sm text-zinc-400">Registre entrada, saída ou cobrança em poucos campos.</p>
          <div className="mt-5">
            <FinanceForms categories={categories} />
          </div>
        </div>

        <div className="hp-card rounded-[2rem] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-[var(--hp-accent)]">Movimentos</p>
              <h2 className="text-2xl font-black">Lançamentos</h2>
            </div>
            <CircleDollarSign className="h-7 w-7 text-zinc-500" />
          </div>

          <div className="mt-5 grid gap-3">
            {transactions.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 p-6 text-zinc-400">Nenhum lancamento financeiro ainda.</p>
            ) : (
              transactions.map((transaction) => {
                const category = Array.isArray(transaction.category) ? transaction.category[0] : transaction.category;
                const isIncome = transaction.type === "INCOME";
                return (
                  <article key={transaction.id} className="flex items-center gap-4 rounded-[1.5rem] bg-white/[0.04] p-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      isIncome ? "bg-emerald-400/10 text-[var(--hp-accent)]" : "bg-red-500/10 text-red-300"
                    }`}>
                      {isIncome ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-black">{transaction.description}</h3>
                      <p className="truncate text-sm text-zinc-500">{category?.name ?? "Sem categoria"} · {transaction.status}</p>
                    </div>
                    <p className={`shrink-0 text-lg font-black ${isIncome ? "text-[var(--hp-accent)]" : "text-red-300"}`}>
                      {isIncome ? "+" : "-"} {formatCurrency(transaction.amount_cents)}
                    </p>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
