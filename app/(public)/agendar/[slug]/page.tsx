import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AgendarPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-zinc-100 p-6">
      <section className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-sm">
        <CalendarDays className="h-10 w-10 text-brand-orange" />
        <h1 className="mt-4 text-3xl font-black">Agendar atendimento</h1>
        <p className="mt-3 text-zinc-600">
          Estrutura inicial para escolher servico, profissional, data, horario e confirmar dados do cliente para {slug}.
        </p>
        <Button asChild className="mt-6">
          <Link href={`/p/${slug}`}>Voltar para vitrine</Link>
        </Button>
      </section>
    </main>
  );
}
