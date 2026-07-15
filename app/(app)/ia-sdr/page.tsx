import { Bot } from "lucide-react";
import { ModulePlaceholder } from "@/components/states/module-placeholder";
import { requireOrganizationAccess } from "@/features/organizations/guards";

export default async function IaSdrPage() {
  await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "SALES"]);

  return (
    <ModulePlaceholder
      title="IA SDR"
      description="Agente preparado para qualificar leads, sugerir follow-ups, encontrar oportunidades e apoiar vendas."
      icon={Bot}
    />
  );
}
