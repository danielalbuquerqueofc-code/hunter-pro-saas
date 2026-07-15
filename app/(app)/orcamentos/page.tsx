import { FileText } from "lucide-react";
import { ModulePlaceholder } from "@/components/states/module-placeholder";
import { requireOrganizationAccess } from "@/features/organizations/guards";

export default async function OrcamentosPage() {
  await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "SALES"]);

  return (
    <ModulePlaceholder
      title="Orcamentos"
      description="Solicitacoes, propostas enviadas, aprovacoes, follow-up automatico e conversao em venda."
      icon={FileText}
    />
  );
}
