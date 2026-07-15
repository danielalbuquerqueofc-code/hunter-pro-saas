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
        title={`${title} pronto para receber dados`}
        description="A estrutura visual, rotas e permissoes estao preparadas. A proxima fase conecta formularios, consultas reais e automacoes do modulo."
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard">Voltar ao painel</Link>
          </Button>
        }
      />
    </section>
  );
}
