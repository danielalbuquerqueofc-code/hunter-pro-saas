"use client";

import { useEffect, useState } from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type Factor = {
  id: string;
  friendly_name?: string | null;
  status?: string;
  factor_type?: string;
};

type Enrollment = {
  factorId: string;
  challengeId: string;
  qrCode?: string;
  secret?: string;
};

export function MfaManager() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  async function loadFactors() {
    setLoading(true);
    setError("");
    const { data, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) {
      setError(listError.message);
    } else {
      setFactors((data?.totp ?? []) as Factor[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFactors();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startEnrollment() {
    setError("");
    setMessage("");
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Hunter Pro"
    });

    if (enrollError || !data) {
      setError(enrollError?.message ?? "Nao foi possivel iniciar o 2FA.");
      return;
    }

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: data.id
    });

    if (challengeError || !challenge) {
      setError(challengeError?.message ?? "Nao foi possivel gerar o desafio 2FA.");
      return;
    }

    setEnrollment({
      factorId: data.id,
      challengeId: challenge.id,
      qrCode: data.totp?.qr_code,
      secret: data.totp?.secret
    });
  }

  async function verifyEnrollment() {
    if (!enrollment || code.length < 6) return;
    setError("");
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: enrollment.factorId,
      challengeId: enrollment.challengeId,
      code
    });

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    setMessage("2FA ativado com sucesso.");
    setEnrollment(null);
    setCode("");
    await loadFactors();
  }

  async function removeFactor(factorId: string) {
    setError("");
    const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId });
    if (removeError) {
      setError(removeError.message);
      return;
    }
    setMessage("Fator removido.");
    await loadFactors();
  }

  async function signOutOtherSessions() {
    setError("");
    const { error: signOutError } = await supabase.auth.signOut({ scope: "others" });
    if (signOutError) {
      setError(signOutError.message);
      return;
    }
    setMessage("Outras sessoes foram encerradas.");
  }

  return (
    <div className="space-y-4">
      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div> : null}

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-brand-orange" />
          <div>
            <p className="font-black text-zinc-950">Verificacao em duas etapas</p>
            <p className="text-sm text-zinc-500">Use um app autenticador para proteger sua conta.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" /> Carregando fatores...</p>
          ) : null}
          {factors.map((factor) => (
            <div key={factor.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3">
              <div>
                <p className="font-bold text-zinc-950">{factor.friendly_name ?? "App autenticador"}</p>
                <p className="text-xs text-zinc-500">{factor.status ?? "ativo"}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => void removeFactor(factor.id)}>
                Remover
              </Button>
            </div>
          ))}
          {!loading && factors.length === 0 ? (
            <p className="rounded-xl bg-white p-3 text-sm text-zinc-500">Nenhum fator 2FA ativo.</p>
          ) : null}
        </div>

        {enrollment ? (
          <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4">
            {enrollment.qrCode ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={enrollment.qrCode} alt="QR Code 2FA" className="mx-auto h-44 w-44" />
            ) : null}
            {enrollment.secret ? (
              <p className="break-all rounded-xl bg-zinc-50 p-3 text-xs text-zinc-500">Chave manual: {enrollment.secret}</p>
            ) : null}
            <Input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" placeholder="Codigo de 6 digitos" />
            <Button type="button" onClick={() => void verifyEnrollment()}>Confirmar 2FA</Button>
          </div>
        ) : (
          <Button type="button" className="mt-4 w-full" variant="secondary" onClick={() => void startEnrollment()}>
            Ativar 2FA
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-center gap-3">
          <KeyRound className="h-5 w-5 text-brand-orange" />
          <div>
            <p className="font-black text-zinc-950">Sessoes ativas</p>
            <p className="text-sm text-zinc-500">Encerre acessos abertos em outros dispositivos.</p>
          </div>
        </div>
        <Button type="button" className="mt-4 w-full" variant="outline" onClick={() => void signOutOtherSessions()}>
          Encerrar outras sessoes
        </Button>
      </div>
    </div>
  );
}
