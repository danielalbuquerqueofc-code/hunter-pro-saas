import { setupChecklist, type SetupChecklistItem } from "@/features/dashboard/mock";
import { createClient } from "@/lib/supabase/server";

type OnboardingProgress = {
  current_step: number | null;
  dismissed: boolean | null;
  onboarding_completed_at: string | null;
};

async function countRows(
  table: string,
  organizationId: string,
  filters: Array<[column: string, value: string]> = []
) {
  const supabase = await createClient();
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  for (const [column, value] of filters) {
    query = query.eq(column, value);
  }

  const { count, error } = await query;

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function getOnboardingProgress(organizationId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("onboarding_progress")
    .select("current_step,dismissed,onboarding_completed_at")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle<OnboardingProgress>();

  if (error) {
    return null;
  }

  return data;
}

export async function getSetupChecklist(organizationId: string): Promise<SetupChecklistItem[]> {
  const supabase = await createClient();
  const { data: organization, error } = await supabase
    .from("organizations")
    .select("logo_url,description,phone,whatsapp,email,address,city,state,zip_code")
    .eq("id", organizationId)
    .maybeSingle();

  if (error) {
    return setupChecklist;
  }

  const [services, professionals, availability, showcases, members, whatsappIntegrations] =
    await Promise.all([
      countRows("services", organizationId),
      countRows("professionals", organizationId),
      countRows("availability_rules", organizationId),
      countRows("showcases", organizationId, [["status", "PUBLISHED"]]),
      countRows("organization_members", organizationId),
      countRows("integrations", organizationId, [
        ["provider", "WHATSAPP"],
        ["status", "CONNECTED"]
      ])
    ]);

  const hasAddress = Boolean(
    organization?.address || organization?.city || organization?.state || organization?.zip_code
  );
  const hasPhone = Boolean(organization?.phone || organization?.whatsapp || organization?.email);

  return setupChecklist.map((item) => {
    const doneByLabel: Record<string, boolean> = {
      "Adicionar logo": Boolean(organization?.logo_url),
      "Preencher descricao": Boolean(organization?.description),
      "Adicionar telefone": hasPhone,
      "Adicionar endereco": hasAddress,
      "Cadastrar primeiro servico": services > 0,
      "Cadastrar primeiro profissional": professionals > 0,
      "Configurar disponibilidade": availability > 0,
      "Publicar vitrine": showcases > 0,
      "Convidar funcionario": members > 1,
      "Conectar WhatsApp": whatsappIntegrations > 0
    };

    return {
      ...item,
      done: doneByLabel[item.label] ?? item.done
    };
  });
}
