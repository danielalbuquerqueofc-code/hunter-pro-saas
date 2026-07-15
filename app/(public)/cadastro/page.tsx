import Link from "next/link";
import { signUpAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CadastroPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function CadastroPage({ searchParams }: CadastroPageProps) {
  const query = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Criar conta Hunter Pro</CardTitle>
        </CardHeader>
        <CardContent>
          {query.error ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {query.error}
            </div>
          ) : null}
          <form action={signUpAction} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Seu nome</Label>
              <Input id="fullName" name="fullName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationName">Nome da empresa</Label>
              <Input id="organizationName" name="organizationName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" minLength={6} required />
            </div>
            <Button type="submit">Criar acesso</Button>
          </form>
          <p className="mt-5 text-sm text-zinc-600">
            Ja tem conta?{" "}
            <Link href="/login" className="font-semibold text-brand-orange">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
