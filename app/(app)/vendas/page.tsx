import { BadgeDollarSign } from "lucide-react";
import { ModulePlaceholder } from "@/components/states/module-placeholder";
import { requireOrganizationAccess } from "@/features/organizations/guards";

export default async function VendasPage() {
  await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "SALES", "FINANCIAL"]);

  return (
    <ModulePlaceholder
      title="Vendas"
      description="Registro de vendas, formas de pagamento, status de recebimento e relacao com clientes e orcamentos."
      icon={BadgeDollarSign}
    />
  );
}
