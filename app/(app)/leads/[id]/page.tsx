import { UserPlus } from "lucide-react";
import { ModulePlaceholder } from "@/components/states/module-placeholder";
import { requireOrganizationAccess } from "@/features/organizations/guards";

export default async function LeadDetalhePage() {
  await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT"]);

  return (
    <ModulePlaceholder
      title="Detalhe do lead"
      description="Historico, origem, consentimento LGPD, interacoes, tarefas e oportunidades vinculadas ao lead."
      icon={UserPlus}
    />
  );
}
