import Link from "next/link";
import { signInAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams;

  return (
    <main className="grid min-h-screen bg-brand-ink lg:grid-cols-[1fr_480px]">
      <section className="hidden p-12 text-white lg:flex lg:flex-col lg:justify-center">
        <span className="mb-8 flex h-14 w-14 items-center justify-center rounded-lg bg-brand-orange font-black">
          HP
        </span>
        <h1 className="max-w-xl text-6xl font-black">Hunter Pro</h1>
        <p className="mt-4 max-w-xl text-lg text-zinc-300">
          Acesse o painel administrativo da sua empresa.
        </p>
      </section>

      <section className="flex items-center justify-center bg-zinc-100 p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
          </CardHeader>
          <CardContent>
            {query.error ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {query.error}
              </div>
            ) : null}
            <form action={signInAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Acessar sistema
              </Button>
            </form>
            <p className="mt-5 text-sm text-zinc-600">
              Ainda nao tem conta?{" "}
              <Link href="/cadastro" className="font-semibold text-brand-orange">
                Criar acesso
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
