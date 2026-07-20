import { Users } from "lucide-react";
import { ModulePlaceholder } from "@/components/states/module-placeholder";
import { requireOrganizationAccess } from "@/features/organizations/guards";

export default async function ClientesPage() {
  await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT"]);

  return (
    <ModulePlaceholder
      title="Clientes"
      description="Base de clientes, historico de compras, agendamentos, tags, preferencias e oportunidades de retorno."
      icon={Users}
    />
  );
}
