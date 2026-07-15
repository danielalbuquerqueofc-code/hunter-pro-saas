import { createClient } from "@/lib/supabase/server";

export async function getFinanceData(organizationId: string) {
  const supabase = await createClient();
  const [{ data: categories }, { data: transactions }] = await Promise.all([
    supabase
      .from("financial_categories")
      .select("*")
      .eq("organization_id", organizationId)
      .order("type", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("financial_transactions")
      .select("*, category:financial_categories(name)")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(80)
  ]);

  return {
    categories: categories ?? [],
    transactions: transactions ?? []
  };
}

export async function getReportData(organizationId: string) {
  const { transactions } = await getFinanceData(organizationId);

  const paidIncome = transactions
    .filter((item) => item.type === "INCOME" && item.status === "PAID")
    .reduce((sum, item) => sum + Number(item.amount_cents ?? 0), 0);

  const paidExpense = transactions
    .filter((item) => item.type === "EXPENSE" && item.status === "PAID")
    .reduce((sum, item) => sum + Number(item.amount_cents ?? 0), 0);

  const pendingIncome = transactions
    .filter((item) => item.type === "INCOME" && item.status === "PENDING")
    .reduce((sum, item) => sum + Number(item.amount_cents ?? 0), 0);

  const pendingExpense = transactions
    .filter((item) => item.type === "EXPENSE" && item.status === "PENDING")
    .reduce((sum, item) => sum + Number(item.amount_cents ?? 0), 0);

  const byCategory = transactions.reduce<Record<string, number>>((acc, item) => {
    const category = Array.isArray(item.category) ? item.category[0] : item.category;
    const name = category?.name ?? "Sem categoria";
    const multiplier = item.type === "INCOME" ? 1 : -1;
    acc[name] = (acc[name] ?? 0) + Number(item.amount_cents ?? 0) * multiplier;
    return acc;
  }, {});

  return {
    transactions,
    summary: {
      paidIncome,
      paidExpense,
      pendingIncome,
      pendingExpense,
      balance: paidIncome - paidExpense
    },
    byCategory
  };
}
