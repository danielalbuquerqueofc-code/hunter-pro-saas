import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AgendamentoRecebidoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-ink p-6 text-white">
      <Card className="max-w-lg border-white/10 bg-white text-zinc-950">
        <CardContent className="p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-brand-orange">Solicitacao recebida</p>
          <h1 className="mt-3 text-3xl font-black">Seu pedido de agendamento foi enviado.</h1>
          <p className="mt-4 text-zinc-600">
            A equipe recebeu seus dados e podera confirmar o melhor horario pelo painel Hunter Pro.
          </p>
          <Button asChild className="mt-6">
            <Link href="/">Voltar ao inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
