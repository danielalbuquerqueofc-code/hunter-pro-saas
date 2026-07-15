import { Users } from "lucide-react";
import { ModulePlaceholder } from "@/components/states/module-placeholder";

export default function ClientesPage() {
  return (
    <ModulePlaceholder
      title="Clientes"
      description="Base de clientes, historico de compras, agendamentos, tags, preferencias e oportunidades de retorno."
      icon={Users}
    />
  );
}
