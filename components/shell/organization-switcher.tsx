import { ChevronDown } from "lucide-react";
import { formatInitials } from "@/lib/utils";

export function OrganizationSwitcher({ name }: { name: string }) {
  return (
    <button
      className="hidden min-w-44 items-center gap-3 border-l border-white/25 pl-5 text-left lg:flex"
      type="button"
      aria-label="Selecionar empresa"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-black">
        {formatInitials(name)}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold text-white/75">Empresa ativa</span>
        <strong className="block truncate text-sm">{name}</strong>
      </span>
      <ChevronDown className="h-4 w-4 text-white/70" />
    </button>
  );
}
