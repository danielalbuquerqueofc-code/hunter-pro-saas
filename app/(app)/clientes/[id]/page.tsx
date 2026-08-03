import { Users } from "lucide-react";
import { redirect } from "next/navigation";
import { ModulePlaceholder } from "@/components/states/module-placeholder";
import { requireOrganizationAccess } from "@/features/organizations/guards";

export default async function ClienteDetalhePage() {
  await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT"]);
  redirect(`/clientes?error=${encodeURIComponent("Detalhe de cliente ainda nao liberado para uso comercial.")}`);

  return (
    <ModulePlaceholder
      title="Detalhe do cliente"
      description="Linha do tempo completa do cliente com atendimentos, vendas, orcamentos, mensagens e consentimentos."
      icon={Users}
    />
  );
}
