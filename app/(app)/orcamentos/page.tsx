import { FileText } from "lucide-react";
import { ModulePlaceholder } from "@/components/states/module-placeholder";
import { requireEnabledOrganizationModuleAccess } from "@/features/organizations/guards";

export default async function OrcamentosPage() {
  await requireEnabledOrganizationModuleAccess("/orcamentos", ["OWNER", "ADMIN", "MANAGER", "SALES"]);

  return (
    <ModulePlaceholder
      title="Orcamentos"
      description="Solicitacoes, propostas enviadas, aprovacoes, follow-up automatico e conversao em venda."
      icon={FileText}
    />
  );
}
