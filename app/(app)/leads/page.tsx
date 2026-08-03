import { UserPlus } from "lucide-react";
import { ModulePlaceholder } from "@/components/states/module-placeholder";
import { requireEnabledOrganizationModuleAccess } from "@/features/organizations/guards";

export default async function LeadsPage() {
  await requireEnabledOrganizationModuleAccess("/leads", ["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT"]);

  return (
    <ModulePlaceholder
      title="Leads"
      description="Central para captar, qualificar e acompanhar novos interessados vindos da vitrine, formularios, WhatsApp e campanhas."
      icon={UserPlus}
    />
  );
}
