import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConversationForm, MessageForm } from "@/features/operations/operation-forms";
import { getOperationsData } from "@/features/operations/queries";
import { requireOrganizationAccess } from "@/features/organizations/guards";

export default async function AtendimentoPage() {
  const { organization } = await requireOrganizationAccess([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "SALES",
    "ATTENDANT"
  ]);

  const { conversations, contacts } = await getOperationsData(organization.id);

  return (
    <>
      <AppHeader title="Atendimento" eyebrow={organization.name} />
      <section className="grid gap-6 p-4 sm:p-6 lg:p-8 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader><CardTitle>Novo atendimento</CardTitle></CardHeader>
          <CardContent>
            <ConversationForm contacts={contacts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Conversas</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {conversations.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhum atendimento iniciado.</p>
            ) : conversations.map((conversation) => {
              const contact = Array.isArray(conversation.contact) ? conversation.contact[0] : conversation.contact;
              return (
                <div key={conversation.id} className="rounded-lg border border-zinc-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-bold">{conversation.subject}</h2>
                      <p className="text-sm text-zinc-500">{contact?.name ?? "Sem contato"} - {conversation.channel}</p>
                    </div>
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-brand-orange">{conversation.status}</span>
                  </div>
                  <MessageForm conversationId={conversation.id} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
