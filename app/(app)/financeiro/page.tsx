import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceForms } from "@/features/finance/finance-forms";
import { getFinanceData } from "@/features/finance/queries";
import { requireOrganizationAccess } from "@/features/organizations/guards";

export default async function FinanceiroPage() {
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "FINANCIAL"]);

  const { categories, transactions } = await getFinanceData(organization.id);
  const income = transactions
    .filter((item) => item.type === "INCOME" && item.status !== "CANCELED")
    .reduce((sum, item) => sum + Number(item.amount_cents ?? 0), 0);
  const expense = transactions
    .filter((item) => item.type === "EXPENSE" && item.status !== "CANCELED")
    .reduce((sum, item) => sum + Number(item.amount_cents ?? 0), 0);

  return (
    <>
      <AppHeader title="Financeiro" eyebrow={organization.name} />
      <section className="grid gap-6 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="p-5"><p className="text-sm font-bold text-emerald-700">Receitas</p><p className="mt-2 text-3xl font-black">R$ {(income / 100).toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm font-bold text-red-700">Despesas</p><p className="mt-2 text-3xl font-black">R$ {(expense / 100).toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm font-bold text-zinc-700">Saldo previsto</p><p className="mt-2 text-3xl font-black">R$ {((income - expense) / 100).toFixed(2)}</p></CardContent></Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <FinanceForms categories={categories} />

          <Card>
            <CardHeader><CardTitle>Lancamentos</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              {transactions.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhum lancamento financeiro ainda.</p>
              ) : (
                transactions.map((transaction) => {
                  const category = Array.isArray(transaction.category) ? transaction.category[0] : transaction.category;
                  return (
                    <div key={transaction.id} className="rounded-lg border border-zinc-200 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="font-bold">{transaction.description}</h2>
                          <p className="text-sm text-zinc-500">{category?.name ?? "Sem categoria"} - {transaction.status}</p>
                        </div>
                        <span className={transaction.type === "INCOME" ? "font-black text-emerald-700" : "font-black text-red-700"}>
                          {transaction.type === "INCOME" ? "+" : "-"} R$ {(transaction.amount_cents / 100).toFixed(2)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-zinc-500">Vencimento: {transaction.due_date ?? "sem data"}</p>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
