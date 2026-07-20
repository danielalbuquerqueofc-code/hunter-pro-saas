import { BriefcaseBusiness } from "lucide-react";
import { ModulePlaceholder } from "@/components/states/module-placeholder";
import { requireOrganizationAccess } from "@/features/organizations/guards";

export default async function PipelinePage() {
  await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "SALES"]);

  return (
    <ModulePlaceholder
      title="Pipeline"
      description="Funil comercial por etapas, oportunidades abertas, follow-ups e previsao de vendas."
      icon={BriefcaseBusiness}
    />
  );
}
