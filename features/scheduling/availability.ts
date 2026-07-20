export type BookingSlotMode = "FIXED_GRID" | "SEQUENTIAL_BLOCKS";

export type SchedulingOrganization = {
  id: string;
  slug?: string | null;
  timezone?: string | null;
  default_appointment_margin_minutes?: number | null;
  booking_min_notice_minutes?: number | null;
  booking_max_days_ahead?: number | null;
  booking_slot_interval_minutes?: number | null;
  booking_slot_mode?: BookingSlotMode | null;
};

export type SchedulingService = {
  id: string;
  organization_id?: string;
  duration_minutes: number;
  margin_before_minutes?: number | null;
  margin_after_minutes?: number | null;
  booking_min_notice_minutes?: number | null;
  booking_max_days_ahead?: number | null;
};

export type SchedulingProfessional = {
  id: string;
  name: string;
  appointment_margin_minutes?: number | null;
  booking_slot_interval_minutes?: number | null;
};

export type SchedulingRule = {
  id: string;
  professional_id: string | null;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_mode?: BookingSlotMode | null;
};

export type SchedulingBusy = {
  id?: string;
  professional_id: string | null;
  starts_at: string;
  ends_at: string;
};

export type AvailabilitySlot = {
  time: string;
  startsAt: string;
  endsAt: string;
  occupiedStartsAt: string;
  occupiedEndsAt: string;
  professionalId: string;
  professionalName: string;
};

function parseMinutes(value: string) {
  const [hour, minute] = value.slice(0, 5).split(":").map(Number);
  return hour * 60 + minute;
}

function formatTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function addMinutes(date: Date, minutes: number) {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
}

function overlaps(start: Date, end: Date, busyStart: string, busyEnd: string) {
  const busyStartDate = new Date(busyStart);
  const busyEndDate = new Date(busyEnd);
  return start < busyEndDate && end > busyStartDate;
}

function dateAt(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

function getWeekday(date: string) {
  return new Date(`${date}T12:00:00`).getDay();
}

export function getServiceMargins({
  organization,
  professional,
  service
}: {
  organization: SchedulingOrganization;
  professional?: SchedulingProfessional;
  service: SchedulingService;
}) {
  const defaultMargin = organization.default_appointment_margin_minutes ?? 10;
  const marginAfter = service.margin_after_minutes ?? professional?.appointment_margin_minutes ?? defaultMargin;

  return {
    before: service.margin_before_minutes ?? 0,
    after: marginAfter,
    total: (service.margin_before_minutes ?? 0) + service.duration_minutes + marginAfter
  };
}

export function canBookDate({
  date,
  organization,
  service,
  now = new Date()
}: {
  date: string;
  organization: SchedulingOrganization;
  service: SchedulingService;
  now?: Date;
}) {
  const minNotice = service.booking_min_notice_minutes ?? organization.booking_min_notice_minutes ?? 120;
  const maxDays = service.booking_max_days_ahead ?? organization.booking_max_days_ahead ?? 30;
  const dayStart = new Date(`${date}T00:00:00`);
  const minDate = addMinutes(now, minNotice);
  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + maxDays);

  return dayStart <= maxDate && new Date(`${date}T23:59:59`) >= minDate;
}

export function calculateAvailabilitySlots({
  date,
  organization,
  service,
  professionals,
  rules,
  appointments,
  blockedTimes,
  holds,
  selectedProfessionalId = "",
  googleBusy = [],
  now = new Date()
}: {
  date: string;
  organization: SchedulingOrganization;
  service: SchedulingService;
  professionals: SchedulingProfessional[];
  rules: SchedulingRule[];
  appointments: SchedulingBusy[];
  blockedTimes: SchedulingBusy[];
  holds: SchedulingBusy[];
  selectedProfessionalId?: string;
  googleBusy?: SchedulingBusy[];
  now?: Date;
}) {
  if (!canBookDate({ date, organization, service, now })) return [];

  const weekday = getWeekday(date);
  const eligibleProfessionals = selectedProfessionalId
    ? professionals.filter((professional) => professional.id === selectedProfessionalId)
    : professionals;

  const slots: AvailabilitySlot[] = [];

  for (const professional of eligibleProfessionals) {
    const margins = getServiceMargins({ organization, professional, service });
    const professionalRules = rules.filter((rule) => {
      const professionalMatches = !rule.professional_id || rule.professional_id === professional.id;
      return rule.weekday === weekday && professionalMatches;
    });

    for (const rule of professionalRules) {
      const slotMode = rule.slot_mode ?? organization.booking_slot_mode ?? "FIXED_GRID";
      const interval =
        slotMode === "SEQUENTIAL_BLOCKS"
          ? margins.total
          : professional.booking_slot_interval_minutes ?? organization.booking_slot_interval_minutes ?? 15;
      const turnStart = parseMinutes(rule.start_time);
      const turnEnd = parseMinutes(rule.end_time);

      for (let minute = turnStart; minute + margins.before + service.duration_minutes + margins.after <= turnEnd; minute += interval) {
        const customerStartMinute = minute + margins.before;
        const startsAt = dateAt(date, formatTime(customerStartMinute));
        const endsAt = addMinutes(startsAt, service.duration_minutes);
        const occupiedStartsAt = dateAt(date, formatTime(minute));
        const occupiedEndsAt = addMinutes(occupiedStartsAt, margins.total);

        if (startsAt < addMinutes(now, service.booking_min_notice_minutes ?? organization.booking_min_notice_minutes ?? 120)) {
          continue;
        }

        const busy = [...appointments, ...blockedTimes, ...holds, ...googleBusy].some((item) => {
          const professionalMatches = !item.professional_id || item.professional_id === professional.id;
          return professionalMatches && overlaps(occupiedStartsAt, occupiedEndsAt, item.starts_at, item.ends_at);
        });

        if (!busy) {
          slots.push({
            time: formatTime(customerStartMinute),
            startsAt: startsAt.toISOString(),
            endsAt: endsAt.toISOString(),
            occupiedStartsAt: occupiedStartsAt.toISOString(),
            occupiedEndsAt: occupiedEndsAt.toISOString(),
            professionalId: professional.id,
            professionalName: professional.name
          });
        }
      }
    }
  }

  const unique = new Map<string, AvailabilitySlot>();
  for (const slot of slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.professionalName.localeCompare(b.professionalName))) {
    const key = selectedProfessionalId ? `${slot.startsAt}:${slot.professionalId}` : slot.startsAt;
    if (!unique.has(key)) unique.set(key, slot);
  }

  return Array.from(unique.values());
}
