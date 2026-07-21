import Link from "next/link";
import { signUpAction } from "@/features/auth/actions";
import { AuthCard } from "@/components/auth/auth-card";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CadastroPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function CadastroPage({ searchParams }: CadastroPageProps) {
  const query = await searchParams;

  return (
    <AuthCard
      title="Criar conta Hunter Pro"
      description="Cadastre sua empresa para configurar vitrine, agenda, clientes e financeiro simples."
    >
      {query.error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
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
          <PasswordField id="password" name="password" autoComplete="new-password" minLength={6} />
        </div>
        <Button type="submit" className="h-12 w-full rounded-2xl bg-emerald-500 text-base font-black text-slate-950 hover:bg-emerald-400">
          Criar acesso
        </Button>
      </form>
      <p className="mt-5 text-sm text-slate-600">
        Ja tem conta?{" "}
        <Link href="/login" className="font-black text-emerald-700">
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}
