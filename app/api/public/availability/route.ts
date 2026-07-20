import { NextResponse } from "next/server";
import { calculateAvailabilitySlots } from "@/features/scheduling/availability";
import { getPublicShowcase } from "@/features/showcase/queries";

type BusyAppointment = {
  professional_id: string | null;
  starts_at: string;
  ends_at: string;
  occupied_starts_at?: string | null;
  occupied_ends_at?: string | null;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") ?? "";
  const serviceId = url.searchParams.get("serviceId") ?? "";
  const professionalId = url.searchParams.get("professionalId") ?? "";
  const date = url.searchParams.get("date") ?? "";

  if (!slug || !serviceId || !date) {
    return NextResponse.json({ ok: false, error: "Informe servico e data." }, { status: 400 });
  }

  const data = await getPublicShowcase(slug);
  if (!data?.organization) {
    return NextResponse.json({ ok: false, error: "Vitrine nao encontrada." }, { status: 404 });
  }

  const service = data.services.find((item) => item.id === serviceId);
  if (!service) {
    return NextResponse.json({ ok: false, error: "Servico indisponivel." }, { status: 404 });
  }

  const links = data.professionalServices as { professional_id: string; service_id: string }[];
  const linkedProfessionalIds = links.filter((item) => item.service_id === serviceId).map((item) => item.professional_id);
  const professionals = linkedProfessionalIds.length
    ? data.professionals.filter((professional) => linkedProfessionalIds.includes(professional.id))
    : data.professionals;

  const slots = calculateAvailabilitySlots({
    date,
    organization: data.organization,
    service,
    professionals,
    rules: data.availabilityRules,
    appointments: (data.appointments as BusyAppointment[]).map((appointment: BusyAppointment) => ({
      professional_id: appointment.professional_id,
      starts_at: appointment.occupied_starts_at ?? appointment.starts_at,
      ends_at: appointment.occupied_ends_at ?? appointment.ends_at
    })),
    blockedTimes: data.blockedTimes,
    holds: (data.holds as { professional_id: string | null; occupied_starts_at: string; occupied_ends_at: string }[]).map((hold) => ({
      professional_id: hold.professional_id,
      starts_at: hold.occupied_starts_at,
      ends_at: hold.occupied_ends_at
    })),
    selectedProfessionalId: professionalId
  });

  return NextResponse.json({
    ok: true,
    timezone: data.organization.timezone ?? "America/Sao_Paulo",
    slotMode: data.organization.booking_slot_mode ?? "FIXED_GRID",
    slots
  });
}
