import { Search } from "lucide-react";

export function GlobalSearch() {
  return (
    <label className="hidden h-11 w-full max-w-xl items-center gap-3 rounded-full bg-white px-4 text-zinc-500 shadow-sm md:flex">
      <Search className="h-5 w-5 text-zinc-400" />
      <input
        className="h-full w-full border-0 bg-transparent text-sm font-medium outline-none placeholder:text-zinc-400"
        placeholder="Buscar clientes, leads, agendamentos, orcamentos, vendas..."
      />
    </label>
  );
}
