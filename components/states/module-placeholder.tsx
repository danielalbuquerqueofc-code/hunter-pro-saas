import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states/empty-state";

type ModulePlaceholderProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  status?: string;
};

export function ModulePlaceholder({
  title,
  description,
  icon,
  status = "Em desenvolvimento"
}: ModulePlaceholderProps) {
  return (
    <section className="px-5 py-8 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-black uppercase text-brand-orange">{status}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">{description}</p>
      </div>
      <EmptyState
        icon={icon}
        title={`${title} bloqueado ate ficar completo`}
        description="Este modulo esta protegido por permissao, mas nao aparece no menu principal enquanto nao tiver fluxo completo, dados reais e operacao ponta a ponta."
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard">Voltar ao painel</Link>
          </Button>
        }
      />
    </section>
  );
}
