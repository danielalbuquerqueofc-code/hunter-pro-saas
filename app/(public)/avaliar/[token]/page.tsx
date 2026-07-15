import { Star } from "lucide-react";

export default async function AvaliarPublicPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <main className="min-h-screen bg-zinc-100 p-6">
      <section className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-sm">
        <Star className="h-10 w-10 text-brand-orange" />
        <h1 className="mt-4 text-3xl font-black">Avaliar atendimento</h1>
        <p className="mt-3 text-zinc-600">
          Estrutura inicial para validar token, registrar nota, comentario e autorizacao de publicacao. Token recebido: {token}.
        </p>
      </section>
    </main>
  );
}
