import { FileText } from "lucide-react";
import { ModulePlaceholder } from "@/components/states/module-placeholder";

export default function OrcamentoDetalhePage() {
  return (
    <ModulePlaceholder
      title="Detalhe do orcamento"
      description="Itens, valores, imagens futuras, status, aceite do cliente e historico de follow-up."
      icon={FileText}
    />
  );
}
