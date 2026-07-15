import { Users } from "lucide-react";
import { ModulePlaceholder } from "@/components/states/module-placeholder";
import { requireOrganizationAccess } from "@/features/organizations/guards";

export default async function UsuariosPage() {
  await requireOrganizationAccess(["OWNER", "ADMIN"]);

  return (
    <ModulePlaceholder
      title="Usuarios"
      description="Convites, membros da empresa, perfis de acesso e permissoes por modulo."
      icon={Users}
    />
  );
}
