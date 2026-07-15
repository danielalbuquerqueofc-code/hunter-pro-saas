import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSuperAdmin } from "@/lib/auth";

export default async function AdminPage() {
  await requireSuperAdmin();

  return (
    <>
      <AppHeader title="Admin" eyebrow="Super administrador" />
      <section className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Central do SaaS</CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-600">
            Painel reservado para operacao global do Hunter Pro. Na Fase 1 ele valida acesso de
            super administrador; as metricas globais entram nas proximas fases.
          </CardContent>
        </Card>
      </section>
    </>
  );
}
