import Link from "next/link";
import { Plus } from "lucide-react";

const actions = [
  { href: "/crm", label: "Novo contato ou oportunidade" },
  { href: "/agenda", label: "Novo horario ou profissional" },
  { href: "/servicos", label: "Novo servico" },
  { href: "/financeiro", label: "Nova transacao" },
  { href: "/tarefas", label: "Nova tarefa" },
  { href: "/vitrine", label: "Editar vitrine" }
];

export function QuickActions() {
  return (
    <div className="group relative hidden lg:block">
      <button
        className="flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-brand-orange shadow-sm"
        type="button"
      >
        <Plus className="h-4 w-4" />
        Acoes rapidas
      </button>
      <div className="invisible absolute right-0 top-12 z-50 w-56 rounded-lg border border-zinc-200 bg-white p-2 text-zinc-800 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="block rounded-md px-3 py-2 text-sm font-bold hover:bg-orange-50 hover:text-brand-orange"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
