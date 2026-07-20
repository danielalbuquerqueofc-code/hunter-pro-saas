import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateAvailabilitySlots } from "@/features/scheduling/availability";
import { getPublicShowcase } from "@/features/showcase/queries";

type BusyAppointment = {
  professional_id: string | null;
  starts_at: string;
  ends_at: string;
  occupied_starts_at?: string | null;
  occupied_ends_at?: string | null;
};

type HoldRequest = {
  slug?: string;
  serviceId?: string;
  professionalId?: string;
  date?: string;
  time?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as HoldRequest | null;

  if (!body?.slug || !body.serviceId || !body.date || !body.time) {
    return NextResponse.json({ ok: false, error: "Escolha servico, data e horario." }, { status: 400 });
  }

  const data = await getPublicShowcase(body.slug);
  if (!data?.organization) {
    return NextResponse.json({ ok: false, error: "Vitrine nao encontrada." }, { status: 404 });
  }

  const service = data.services.find((item) => item.id === body.serviceId);
  if (!service) {
    return NextResponse.json({ ok: false, error: "Servico indisponivel." }, { status: 404 });
  }

  const links = data.professionalServices as { professional_id: string; service_id: string }[];
  const linkedProfessionalIds = links.filter((item) => item.service_id === body.serviceId).map((item) => item.professional_id);
  const professionals = linkedProfessionalIds.length
    ? data.professionals.filter((professional) => linkedProfessionalIds.includes(professional.id))
    : data.professionals;

  const slots = calculateAvailabilitySlots({
    date: body.date,
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
    selectedProfessionalId: body.professionalId ?? ""
  });

  const selected = slots.find((slot) => {
    const sameProfessional = body.professionalId ? slot.professionalId === body.professionalId : true;
    return sameProfessional && slot.time === body.time;
  });

  if (!selected) {
    return NextResponse.json(
      { ok: false, error: "Esse horario acabou de ficar indisponivel. Escolha uma das novas opcoes." },
      { status: 409 }
    );
  }

  const supabase = await createClient();
  const { data: holdResult, error } = await supabase.rpc("create_public_appointment_hold", {
    p_organization_id: data.organization.id,
    p_professional_id: selected.professionalId,
    p_service_id: service.id,
    p_starts_at: selected.startsAt,
    p_ends_at: selected.endsAt,
    p_occupied_starts_at: selected.occupiedStartsAt,
    p_occupied_ends_at: selected.occupiedEndsAt
  });

  if (error) {
    console.error("create_public_appointment_hold", error.message);
    return NextResponse.json({ ok: false, error: "Nao foi possivel reservar esse horario agora." }, { status: 500 });
  }

  return NextResponse.json(holdResult);
}
