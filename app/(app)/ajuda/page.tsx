import Link from "next/link";
import { HelpCircle, MessageCircle, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationAccess } from "@/features/organizations/guards";

export default async function AjudaPage() {
  await requireOrganizationAccess();

  return (
    <>
      <AppHeader title="Ajuda e suporte" eyebrow="Central de orientacao" />
      <main className="grid gap-6 p-5 pb-28 lg:grid-cols-3 lg:p-8">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-brand-orange" />
              Primeiros passos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-zinc-600">
            <p>Configure empresa, vitrine, servicos, profissionais e agenda antes de divulgar o link publico.</p>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/configuracoes">Abrir configuracoes</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-brand-orange" />
              Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-zinc-600">
            <p>Use Atendimento e Clientes para acompanhar contatos, historico e proximas acoes.</p>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/atendimento">Abrir atendimento</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-orange" />
              Acesso e permissoes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-zinc-600">
            <p>Administradores podem revisar equipe, plano, bloqueios e dados da empresa nas areas de sistema.</p>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/usuarios">Abrir equipe</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
