import Link from "next/link";
import { signInAction } from "@/features/auth/actions";
import { AuthCard } from "@/components/auth/auth-card";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams;

  return (
    <AuthCard title="Entrar no Hunter Pro" description="Use o e-mail autorizado para acessar sua empresa com seguranca.">
      {query.error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          {query.error}
        </div>
      ) : null}
      <form action={signInAction} className="space-y-4">
        <input type="hidden" name="next" value={query.next ?? ""} />
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Senha</Label>
            <Link href="/recuperar-senha" className="text-xs font-black text-emerald-700 hover:text-emerald-800">
              Recuperar senha
            </Link>
          </div>
          <PasswordField id="password" name="password" autoComplete="current-password" />
        </div>
        <Button type="submit" className="h-12 w-full rounded-2xl bg-emerald-500 text-base font-black text-slate-950 hover:bg-emerald-400">
          Acessar sistema
        </Button>
      </form>
      <p className="mt-5 text-sm text-slate-600">
        Ainda nao tem conta?{" "}
        <Link href="/cadastro" className="font-black text-emerald-700">
          Criar acesso
        </Link>
      </p>
    </AuthCard>
  );
}
