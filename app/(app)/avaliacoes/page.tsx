import { Star } from "lucide-react";
import { ModulePlaceholder } from "@/components/states/module-placeholder";
import { requireOrganizationAccess } from "@/features/organizations/guards";

export default async function AvaliacoesPage() {
  await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "ATTENDANT"]);

  return (
    <ModulePlaceholder
      title="Avaliacoes"
      description="Coleta de notas, comentarios, autorizacao de publicacao e exibicao futura na vitrine digital."
      icon={Star}
    />
  );
}
