import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getReportData } from "@/features/finance/queries";
import { requireOrganizationAccess } from "@/features/organizations/guards";

export default async function RelatoriosPage() {
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "FINANCIAL"]);

  const report = await getReportData(organization.id);
  const categoryRows = Object.entries(report.byCategory).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  return (
    <>
      <AppHeader title="Relatorios" eyebrow={organization.name} />
      <section className="grid gap-6 p-8">
        <div className="grid gap-4 md:grid-cols-5">
          <Card><CardContent className="p-5"><p className="text-sm font-bold text-emerald-700">Receita paga</p><p className="mt-2 text-2xl font-black">R$ {(report.summary.paidIncome / 100).toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm font-bold text-red-700">Despesa paga</p><p className="mt-2 text-2xl font-black">R$ {(report.summary.paidExpense / 100).toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm font-bold text-zinc-700">Saldo</p><p className="mt-2 text-2xl font-black">R$ {(report.summary.balance / 100).toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm font-bold text-orange-700">A receber</p><p className="mt-2 text-2xl font-black">R$ {(report.summary.pendingIncome / 100).toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm font-bold text-orange-700">A pagar</p><p className="mt-2 text-2xl font-black">R$ {(report.summary.pendingExpense / 100).toFixed(2)}</p></CardContent></Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <Card>
            <CardHeader><CardTitle>Movimento por categoria</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              {categoryRows.length === 0 ? (
                <p className="text-sm text-zinc-500">Sem dados financeiros para relatorio.</p>
              ) : (
                categoryRows.map(([name, amount]) => (
                  <div key={name} className="rounded-lg border border-zinc-200 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <strong>{name}</strong>
                      <span className={amount >= 0 ? "font-black text-emerald-700" : "font-black text-red-700"}>
                        R$ {(amount / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-zinc-100">
                      <div
                        className={amount >= 0 ? "h-2 rounded-full bg-emerald-500" : "h-2 rounded-full bg-red-500"}
                        style={{ width: `${Math.min(100, Math.max(8, Math.abs(amount) / 1000))}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Controle LGPD</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-sm text-zinc-600">
              <p>Relatorios financeiros ficam restritos a perfis autorizados da empresa.</p>
              <p>Nenhum dado financeiro e exposto para usuarios anonimos.</p>
              <p>As proximas integracoes de pagamento deverao registrar origem, provedor e status de sincronizacao.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
