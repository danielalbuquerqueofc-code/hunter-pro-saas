"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveOnboardingProgressAction } from "@/features/onboarding/actions";

const steps = [
  "Bem-vindo ao Hunter Pro",
  "Complete os dados da empresa",
  "Cadastre seus servicos",
  "Cadastre seus profissionais",
  "Configure seus horarios",
  "Personalize sua vitrine",
  "Compartilhe seu link",
  "Conheca o dashboard"
];

type OnboardingModalProps = {
  initialDismissed?: boolean;
  initialStep?: number;
};

export function OnboardingModal({
  initialDismissed = false,
  initialStep = 0
}: OnboardingModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(() => Math.min(Math.max(initialStep, 0), steps.length - 1));
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setOpen(
      !initialDismissed &&
        window.localStorage.getItem("hunter-pro-onboarding-dismissed") !== "true"
    );
  }, [initialDismissed]);

  function persistProgress(nextStep: number, options?: { completed?: boolean; dismissed?: boolean }) {
    startTransition(() => {
      void saveOnboardingProgressAction({
        currentStep: nextStep,
        completed: options?.completed,
        dismissed: options?.dismissed
      });
    });
  }

  function close(options?: { completed?: boolean; dismissed?: boolean }) {
    if (dontShowAgain || options?.dismissed || step === steps.length - 1) {
      window.localStorage.setItem("hunter-pro-onboarding-dismissed", "true");
    }

    persistProgress(step, {
      completed: options?.completed ?? step === steps.length - 1,
      dismissed: options?.dismissed ?? dontShowAgain
    });
    setOpen(false);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-brand-orange px-3 py-2 text-sm font-black text-white">HP</span>
            <strong>Hunter Pro</strong>
          </div>
          <button
            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100"
            type="button"
            onClick={() => close({ dismissed: true })}
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="aspect-video rounded-lg bg-gradient-to-br from-brand-ink via-brand-panel to-brand-orange p-6 text-white">
          <p className="text-xs font-black uppercase text-white/60">Primeiros passos</p>
          <h2 className="mt-3 max-w-sm text-3xl font-black">{steps[step]}</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/75">
            Configure a base da sua empresa, publique sua vitrine e acompanhe oportunidades pelo painel operacional.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            className="text-sm font-bold text-zinc-500 hover:text-zinc-900"
            type="button"
            onClick={() => close({ dismissed: true })}
          >
            Pular
          </button>
          <div className="flex gap-1">
            {steps.map((item, index) => (
              <span
                key={item}
                className={`h-2 w-2 rounded-full ${index === step ? "bg-brand-orange" : "bg-zinc-200"}`}
              />
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(event) => setDontShowAgain(event.target.checked)}
            />
            Nao mostrar novamente
          </label>
        </div>

        <div className="mt-6 flex justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (step === steps.length - 1) {
                close({ completed: true });
                return;
              }
              setStep((current) => {
                const nextStep = current + 1;
                persistProgress(nextStep);
                return nextStep;
              });
            }}
          >
            {step === steps.length - 1 ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Concluir
              </>
            ) : (
              <>
                Avancar
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
