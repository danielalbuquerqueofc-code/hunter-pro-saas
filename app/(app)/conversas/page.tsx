import { MessagesSquare } from "lucide-react";
import { ModulePlaceholder } from "@/components/states/module-placeholder";
import { requireOrganizationAccess } from "@/features/organizations/guards";

export default async function ConversasPage() {
  await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT"]);

  return (
    <ModulePlaceholder
      title="Conversas"
      description="Inbox preparada para WhatsApp, Instagram, e-mail e webchat, com atendimento por equipe e IA SDR."
      icon={MessagesSquare}
    />
  );
}
