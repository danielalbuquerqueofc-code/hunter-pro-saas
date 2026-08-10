import { ShowcaseStudio } from "@/components/showcase/showcase-studio";
import { getAgendaData } from "@/features/appointments/queries";
import { requireOrganizationAccess } from "@/features/organizations/guards";
import { getServicesData } from "@/features/services/queries";
import { getShowcaseByOrganization } from "@/features/showcase/queries";

export default async function VitrinePage() {
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER"]);
  const [{ showcase, links }, { services }, { appointments }] = await Promise.all([
    getShowcaseByOrganization(organization.id),
    getServicesData(organization.id),
    getAgendaData(organization.id)
  ]);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://prospectorads.com";
  const publicUrl = `${appUrl.replace(/\/$/, "")}/p/${organization.slug}`;

  return (
    <section className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-black uppercase tracking-wide text-[var(--hp-accent)]">{organization.name}</p>
        <h1 className="mt-1 text-4xl font-black tracking-tight">Vitrine digital</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Edite sua pagina publica, organize links, destaque servicos e compartilhe um QR Code para receber agendamentos.
        </p>
      </div>

      <ShowcaseStudio
        organizationId={organization.id}
        organizationName={organization.name}
        publicUrl={publicUrl}
        showcase={showcase}
        links={links}
        services={services}
        analytics={{
          views: null,
          clicks: null,
          appointments: appointments.length
        }}
      />
    </section>
  );
}
