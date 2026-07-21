"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const dismissKey = "hunter-pro-pwa-dismissed";

export function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);

  const isStandalone = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
    );
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    if (typeof window === "undefined" || window.localStorage.getItem(dismissKey) === "1" || isStandalone) return;

    const userAgent = window.navigator.userAgent;
    const iosSafari = /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent);
    if (iosSafari) {
      window.requestAnimationFrame(() => {
        setIsIosSafari(true);
        setVisible(true);
      });
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, [isStandalone]);

  if (!visible || isStandalone) return null;

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice.catch(() => null);
    setInstallPrompt(null);
    setVisible(false);
  }

  function dismiss() {
    window.localStorage.setItem(dismissKey, "1");
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-[90] mx-auto max-w-md rounded-3xl border border-slate-200 bg-white/95 p-4 text-slate-950 shadow-2xl shadow-slate-900/18 backdrop-blur">
      <button
        type="button"
        aria-label="Fechar aviso de instalacao"
        onClick={dismiss}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      <p className="pr-9 text-sm font-black">Instalar Hunter Pro</p>
      <p className="mt-1 pr-6 text-xs leading-5 text-slate-600">
        {isIosSafari
          ? "No iPhone, toque em Compartilhar e depois em Adicionar a Tela de Inicio."
          : "Abra o sistema como app, com acesso rapido na tela inicial do celular."}
      </p>
      {installPrompt ? (
        <button
          type="button"
          onClick={install}
          className="mt-3 h-10 rounded-2xl bg-emerald-500 px-4 text-sm font-black text-slate-950 hover:bg-emerald-400"
        >
          Instalar app
        </button>
      ) : null}
    </div>
  );
}
