import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrecosPage() {
  return (
    <main className="min-h-screen bg-zinc-100 px-6 py-12">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-black">Planos Hunter Pro</h1>
        <p className="mt-3 text-zinc-600">Estrutura preparada para pagamento nas proximas fases.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {["Free", "Pro", "Scale"].map((plan) => (
            <Card key={plan}>
              <CardHeader>
                <CardTitle>{plan}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-6 text-sm text-zinc-600">
                  Plano base cadastrado no Supabase para evolucao comercial.
                </p>
                <Button asChild variant={plan === "Pro" ? "default" : "outline"} className="w-full">
                  <Link href="/cadastro">Comecar</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
