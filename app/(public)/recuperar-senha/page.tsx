import Link from "next/link";
import { requestPasswordRecoveryAction } from "@/features/auth/actions";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RecuperarSenhaPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function RecuperarSenhaPage({ searchParams }: RecuperarSenhaPageProps) {
  const query = await searchParams;

  return (
    <AuthCard
      title="Recuperar senha"
      description="Informe seu e-mail e enviaremos um link seguro para definir uma nova senha."
    >
      {query.error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          {query.error}
        </div>
      ) : null}
      {query.success ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
          Link enviado. Verifique seu e-mail e use o botao recebido para continuar.
        </div>
      ) : null}
      <form action={requestPasswordRecoveryAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <Button type="submit" className="h-12 w-full rounded-2xl bg-emerald-500 text-base font-black text-slate-950 hover:bg-emerald-400">
          Enviar link seguro
        </Button>
      </form>
      <p className="mt-5 text-sm text-slate-600">
        Lembrou a senha?{" "}
        <Link href="/login" className="font-black text-emerald-700">
          Voltar para entrar
        </Link>
      </p>
    </AuthCard>
  );
}
