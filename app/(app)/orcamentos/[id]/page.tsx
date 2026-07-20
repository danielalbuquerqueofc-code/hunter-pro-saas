import { FileText } from "lucide-react";
import { ModulePlaceholder } from "@/components/states/module-placeholder";
import { requireOrganizationAccess } from "@/features/organizations/guards";

export default async function OrcamentoDetalhePage() {
  await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "SALES"]);

  return (
    <ModulePlaceholder
      title="Detalhe do orcamento"
      description="Itens, valores, imagens futuras, status, aceite do cliente e historico de follow-up."
      icon={FileText}
    />
  );
}
