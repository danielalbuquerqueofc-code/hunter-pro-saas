import { BriefcaseBusiness } from "lucide-react";
import { ModulePlaceholder } from "@/components/states/module-placeholder";

export default function PipelinePage() {
  return (
    <ModulePlaceholder
      title="Pipeline"
      description="Funil comercial por etapas, oportunidades abertas, follow-ups e previsao de vendas."
      icon={BriefcaseBusiness}
    />
  );
}
