import { UserPlus } from "lucide-react";
import { ModulePlaceholder } from "@/components/states/module-placeholder";

export default function LeadsPage() {
  return (
    <ModulePlaceholder
      title="Leads"
      description="Central para captar, qualificar e acompanhar novos interessados vindos da vitrine, formularios, WhatsApp e campanhas."
      icon={UserPlus}
    />
  );
}
