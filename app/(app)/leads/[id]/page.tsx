import { UserPlus } from "lucide-react";
import { ModulePlaceholder } from "@/components/states/module-placeholder";

export default function LeadDetalhePage() {
  return (
    <ModulePlaceholder
      title="Detalhe do lead"
      description="Historico, origem, consentimento LGPD, interacoes, tarefas e oportunidades vinculadas ao lead."
      icon={UserPlus}
    />
  );
}
