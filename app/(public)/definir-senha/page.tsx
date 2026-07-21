import Link from "next/link";
import { definePasswordAction } from "@/features/auth/actions";
import { AuthCard } from "@/components/auth/auth-card";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type DefinirSenhaPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function DefinirSenhaPage({ searchParams }: DefinirSenhaPageProps) {
  const query = await searchParams;

  return (
    <AuthCard
      title="Definir senha"
      description="Crie uma senha segura para concluir seu convite ou recuperar o acesso."
    >
      {query.error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          {query.error}
        </div>
      ) : null}
      <form action={definePasswordAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nova senha</Label>
          <PasswordField id="password" name="password" autoComplete="new-password" minLength={8} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <PasswordField id="confirmPassword" name="confirmPassword" autoComplete="new-password" minLength={8} />
        </div>
        <Button type="submit" className="h-12 w-full rounded-2xl bg-emerald-500 text-base font-black text-slate-950 hover:bg-emerald-400">
          Salvar senha e entrar
        </Button>
      </form>
      <p className="mt-5 text-sm text-slate-600">
        O link expirou?{" "}
        <Link href="/recuperar-senha" className="font-black text-emerald-700">
          Solicitar novo link
        </Link>
      </p>
    </AuthCard>
  );
}
