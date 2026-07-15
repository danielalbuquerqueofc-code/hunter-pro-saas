import { Users } from "lucide-react";
import { ModulePlaceholder } from "@/components/states/module-placeholder";

export default function ClienteDetalhePage() {
  return (
    <ModulePlaceholder
      title="Detalhe do cliente"
      description="Linha do tempo completa do cliente com atendimentos, vendas, orcamentos, mensagens e consentimentos."
      icon={Users}
    />
  );
}
