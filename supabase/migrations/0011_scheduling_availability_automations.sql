create extension if not exists btree_gist;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'booking_slot_mode') then
    create type public.booking_slot_mode as enum ('FIXED_GRID', 'SEQUENTIAL_BLOCKS');
  end if;
  if not exists (select 1 from pg_type where typname = 'booking_confirmation_mode') then
    create type public.booking_confirmation_mode as enum ('AUTOMATIC', 'MANUAL');
  end if;
  if not exists (select 1 from pg_type where typname = 'appointment_hold_status') then
    create type public.appointment_hold_status as enum ('AVAILABLE', 'TEMPORARILY_HELD', 'BOOKED', 'BLOCKED', 'UNAVAILABLE', 'EXPIRED');
  end if;
  if not exists (select 1 from pg_type where typname = 'reminder_job_status') then
    create type public.reminder_job_status as enum ('SCHEDULED', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED', 'SKIPPED');
  end if;
  if not exists (select 1 from pg_type where typname = 'reminder_channel') then
    create type public.reminder_channel as enum ('WHATSAPP', 'EMAIL', 'INTERNAL');
  end if;
end $$;

alter table public.organizations add column if not exists timezone text not null default 'America/Sao_Paulo';
alter table public.organizations add column if not exists default_appointment_margin_minutes integer not null default 10 check (default_appointment_margin_minutes between 0 and 240);
alter table public.organizations add column if not exists booking_min_notice_minutes integer not null default 120 check (booking_min_notice_minutes >= 0);
alter table public.organizations add column if not exists booking_max_days_ahead integer not null default 30 check (booking_max_days_ahead between 1 and 365);
alter table public.organizations add column if not exists booking_slot_interval_minutes integer not null default 15 check (booking_slot_interval_minutes in (5, 10, 15, 30, 60));
alter table public.organizations add column if not exists booking_slot_mode public.booking_slot_mode not null default 'FIXED_GRID';
alter table public.organizations add column if not exists booking_confirmation_mode public.booking_confirmation_mode not null default 'AUTOMATIC';
alter table public.organizations add column if not exists quiet_hours_start time not null default '21:00';
alter table public.organizations add column if not exists quiet_hours_end time not null default '08:00';
alter table public.organizations add column if not exists quiet_hours_policy text not null default 'DELAY' check (quiet_hours_policy in ('ADVANCE','DELAY','SKIP'));

alter table public.services add column if not exists margin_before_minutes integer not null default 0 check (margin_before_minutes >= 0);
alter table public.services add column if not exists margin_after_minutes integer check (margin_after_minutes >= 0);
alter table public.services add column if not exists booking_min_notice_minutes integer check (booking_min_notice_minutes >= 0);
alter table public.services add column if not exists booking_max_days_ahead integer check (booking_max_days_ahead between 1 and 365);

alter table public.professionals add column if not exists appointment_margin_minutes integer check (appointment_margin_minutes >= 0);
alter table public.professionals add column if not exists booking_slot_interval_minutes integer check (booking_slot_interval_minutes in (5, 10, 15, 30, 60));
alter table public.professionals add column if not exists google_calendar_id text;
alter table public.professionals add column if not exists google_calendar_blocks_availability boolean not null default false;

alter table public.availability_rules add column if not exists label text;
alter table public.availability_rules add column if not exists slot_mode public.booking_slot_mode;

alter table public.blocked_times add column if not exists block_type text not null default 'MANUAL' check (block_type in ('MANUAL','LUNCH','BREAK','VACATION','HOLIDAY','SPECIAL_CLOSED'));

alter table public.appointments add column if not exists public_token uuid not null default gen_random_uuid();
alter table public.appointments add column if not exists hold_id uuid;
alter table public.appointments add column if not exists status_v2 text not null default 'pending';
alter table public.appointments add column if not exists occupied_starts_at timestamptz;
alter table public.appointments add column if not exists occupied_ends_at timestamptz;
alter table public.appointments add column if not exists timezone text not null default 'America/Sao_Paulo';
alter table public.appointments add column if not exists consent_whatsapp boolean not null default false;
alter table public.appointments add column if not exists consent_whatsapp_at timestamptz;
alter table public.appointments add column if not exists consent_origin text;
alter table public.appointments add column if not exists google_calendar_id text;
alter table public.appointments add column if not exists google_event_id text;
alter table public.appointments add column if not exists google_sync_status text not null default 'PENDING';
alter table public.appointments add column if not exists google_last_sync_at timestamptz;
alter table public.appointments add column if not exists google_last_error text;
alter table public.appointments add column if not exists google_attempt_count integer not null default 0;
alter table public.appointments add column if not exists whatsapp_sync_status text not null default 'PENDING';
alter table public.appointments add column if not exists whatsapp_last_sync_at timestamptz;
alter table public.appointments add column if not exists whatsapp_last_error text;
alter table public.appointments add column if not exists whatsapp_attempt_count integer not null default 0;
alter table public.appointments add column if not exists cancellation_reason text;
alter table public.appointments add column if not exists cancelled_at timestamptz;

update public.appointments
set occupied_starts_at = coalesce(occupied_starts_at, starts_at),
    occupied_ends_at = coalesce(occupied_ends_at, ends_at)
where occupied_starts_at is null or occupied_ends_at is null;

alter table public.appointments
  alter column occupied_starts_at set default now();

alter table public.appointments
  alter column occupied_ends_at set default now();

create table if not exists public.appointment_holds (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  occupied_starts_at timestamptz not null,
  occupied_ends_at timestamptz not null,
  expires_at timestamptz not null,
  session_token uuid not null default gen_random_uuid(),
  status public.appointment_hold_status not null default 'TEMPORARILY_HELD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_holds_range_check check (starts_at < ends_at and occupied_starts_at < occupied_ends_at)
);

create table if not exists public.appointment_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete cascade,
  event_type text not null,
  actor_type text not null default 'system',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  template_key text not null,
  name text not null,
  channel public.reminder_channel not null default 'WHATSAPP',
  body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, template_key, channel)
);

create table if not exists public.reminder_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  channel public.reminder_channel not null default 'WHATSAPP',
  offset_minutes integer not null,
  timing text not null default 'BEFORE' check (timing in ('AFTER_BOOKING','BEFORE','AFTER')),
  template_key text not null,
  status_filter text[] not null default array['confirmed'],
  is_transactional boolean not null default true,
  is_active boolean not null default true,
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  send_window_start time,
  send_window_end time,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reminder_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  channel public.reminder_channel not null default 'WHATSAPP',
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  status public.reminder_job_status not null default 'SCHEDULED',
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  provider_message_id text,
  error_message text,
  idempotency_key text not null,
  payload jsonb not null default '{}'::jsonb,
  processing_started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create table if not exists public.whatsapp_message_deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  reminder_job_id uuid references public.reminder_jobs(id) on delete set null,
  to_phone text not null,
  status text not null default 'PENDING',
  provider_message_id text,
  attempt_count integer not null default 0,
  last_error text,
  next_attempt_at timestamptz,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create table if not exists public.google_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  professional_id uuid references public.professionals(id) on delete cascade,
  status text not null default 'DISCONNECTED',
  google_account_email text,
  calendar_id text,
  blocks_availability boolean not null default true,
  secret_ref text,
  access_token_expires_at timestamptz,
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointment_holds_org_time_idx on public.appointment_holds(organization_id, occupied_starts_at, occupied_ends_at);
create index if not exists appointment_holds_expiry_idx on public.appointment_holds(expires_at, status);
create index if not exists appointments_public_token_idx on public.appointments(public_token);
create index if not exists appointments_occupied_idx on public.appointments(organization_id, professional_id, occupied_starts_at, occupied_ends_at);
create index if not exists reminder_jobs_due_idx on public.reminder_jobs(status, scheduled_at);
create index if not exists reminder_jobs_appointment_idx on public.reminder_jobs(appointment_id);
create index if not exists google_calendar_connections_org_idx on public.google_calendar_connections(organization_id, professional_id);

drop index if exists appointments_no_overlap_active_idx;
drop index if exists appointment_holds_no_overlap_active_idx;

create index if not exists appointments_active_overlap_lookup_idx
on public.appointments using gist (
  organization_id,
  professional_id,
  tstzrange(occupied_starts_at, occupied_ends_at, '[)')
)
where status_v2 not in ('cancelled_by_customer','cancelled_by_company','no_show');

create index if not exists appointment_holds_active_overlap_lookup_idx
on public.appointment_holds using gist (
  organization_id,
  professional_id,
  tstzrange(occupied_starts_at, occupied_ends_at, '[)')
)
where status = 'TEMPORARILY_HELD';

create trigger appointment_holds_set_updated_at before update on public.appointment_holds for each row execute function public.set_updated_at();
create trigger message_templates_set_updated_at before update on public.message_templates for each row execute function public.set_updated_at();
create trigger reminder_rules_set_updated_at before update on public.reminder_rules for each row execute function public.set_updated_at();
create trigger reminder_jobs_set_updated_at before update on public.reminder_jobs for each row execute function public.set_updated_at();
create trigger whatsapp_message_deliveries_set_updated_at before update on public.whatsapp_message_deliveries for each row execute function public.set_updated_at();
create trigger google_calendar_connections_set_updated_at before update on public.google_calendar_connections for each row execute function public.set_updated_at();

alter table public.appointment_holds enable row level security;
alter table public.appointment_history enable row level security;
alter table public.message_templates enable row level security;
alter table public.reminder_rules enable row level security;
alter table public.reminder_jobs enable row level security;
alter table public.whatsapp_message_deliveries enable row level security;
alter table public.google_calendar_connections enable row level security;

drop policy if exists "appointment_history_select_staff" on public.appointment_history;
create policy "appointment_history_select_staff" on public.appointment_history for select to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

drop policy if exists "appointment_automation_staff" on public.message_templates;
create policy "appointment_automation_staff" on public.message_templates for all to authenticated
using (public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']::public.member_role[]) or public.is_super_admin())
with check (public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']::public.member_role[]) or public.is_super_admin());

drop policy if exists "reminder_rules_staff" on public.reminder_rules;
create policy "reminder_rules_staff" on public.reminder_rules for all to authenticated
using (public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']::public.member_role[]) or public.is_super_admin())
with check (public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']::public.member_role[]) or public.is_super_admin());

drop policy if exists "reminder_jobs_select_staff" on public.reminder_jobs;
create policy "reminder_jobs_select_staff" on public.reminder_jobs for select to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

drop policy if exists "whatsapp_deliveries_select_staff" on public.whatsapp_message_deliveries;
create policy "whatsapp_deliveries_select_staff" on public.whatsapp_message_deliveries for select to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

drop policy if exists "google_connections_staff" on public.google_calendar_connections;
create policy "google_connections_staff" on public.google_calendar_connections for all to authenticated
using (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[]) or public.is_super_admin())
with check (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[]) or public.is_super_admin());

grant select, insert, update on public.appointment_holds to authenticated;
grant select on public.appointment_history to authenticated;
grant select, insert, update, delete on public.message_templates to authenticated;
grant select, insert, update, delete on public.reminder_rules to authenticated;
grant select, update on public.reminder_jobs to authenticated;
grant select on public.whatsapp_message_deliveries to authenticated;
grant select, insert, update, delete on public.google_calendar_connections to authenticated;

create or replace function public.create_public_appointment_hold(
  p_organization_id uuid,
  p_professional_id uuid,
  p_service_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_occupied_starts_at timestamptz,
  p_occupied_ends_at timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hold public.appointment_holds;
begin
  update public.appointment_holds
  set status = 'EXPIRED'
  where status = 'TEMPORARILY_HELD' and expires_at <= now();

  if p_starts_at < now() or p_occupied_starts_at < now() then
    return jsonb_build_object('ok', false, 'error', 'Esse horario ja passou.');
  end if;

  perform pg_advisory_xact_lock(hashtext(p_organization_id::text || ':' || p_professional_id::text));

  if exists (
    select 1 from public.appointments a
    where a.organization_id = p_organization_id
      and a.professional_id = p_professional_id
      and a.status_v2 not in ('cancelled_by_customer','cancelled_by_company','no_show')
      and tstzrange(a.occupied_starts_at, a.occupied_ends_at, '[)') && tstzrange(p_occupied_starts_at, p_occupied_ends_at, '[)')
  ) or exists (
    select 1 from public.appointment_holds h
    where h.organization_id = p_organization_id
      and h.professional_id = p_professional_id
      and h.status = 'TEMPORARILY_HELD'
      and h.expires_at > now()
      and tstzrange(h.occupied_starts_at, h.occupied_ends_at, '[)') && tstzrange(p_occupied_starts_at, p_occupied_ends_at, '[)')
  ) then
    return jsonb_build_object('ok', false, 'error', 'Esse horario acabou de ser reservado por outra pessoa.');
  end if;

  insert into public.appointment_holds (
    organization_id, professional_id, service_id, starts_at, ends_at,
    occupied_starts_at, occupied_ends_at, expires_at
  ) values (
    p_organization_id, p_professional_id, p_service_id, p_starts_at, p_ends_at,
    p_occupied_starts_at, p_occupied_ends_at, now() + interval '5 minutes'
  )
  returning * into v_hold;

  return jsonb_build_object(
    'ok', true,
    'hold_id', v_hold.id,
    'session_token', v_hold.session_token,
    'expires_at', v_hold.expires_at
  );
end;
$$;

create or replace function public.confirm_public_appointment_from_hold(
  p_hold_id uuid,
  p_session_token uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_notes text,
  p_consent_whatsapp boolean,
  p_consent_origin text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hold public.appointment_holds;
  v_org public.organizations;
  v_service public.services;
  v_appointment public.appointments;
  v_status_v2 text;
  v_status public.appointment_status;
begin
  update public.appointment_holds
  set status = 'EXPIRED'
  where status = 'TEMPORARILY_HELD' and expires_at <= now();

  select * into v_hold
  from public.appointment_holds
  where id = p_hold_id
    and session_token = p_session_token
  for update;

  if v_hold.id is null or v_hold.status <> 'TEMPORARILY_HELD' or v_hold.expires_at <= now() then
    return jsonb_build_object('ok', false, 'error', 'A reserva temporaria expirou. Escolha outro horario.');
  end if;

  perform pg_advisory_xact_lock(hashtext(v_hold.organization_id::text || ':' || v_hold.professional_id::text));

  if exists (
    select 1 from public.appointments a
    where a.organization_id = v_hold.organization_id
      and a.professional_id = v_hold.professional_id
      and a.status_v2 not in ('cancelled_by_customer','cancelled_by_company','no_show')
      and tstzrange(a.occupied_starts_at, a.occupied_ends_at, '[)') && tstzrange(v_hold.occupied_starts_at, v_hold.occupied_ends_at, '[)')
  ) then
    update public.appointment_holds set status = 'EXPIRED' where id = v_hold.id;
    return jsonb_build_object('ok', false, 'error', 'Esse horario acabou de ser reservado por outra pessoa.');
  end if;

  select * into v_org from public.organizations where id = v_hold.organization_id and status = 'ACTIVE';
  select * into v_service from public.services where id = v_hold.service_id and organization_id = v_hold.organization_id and is_active = true;

  if v_org.id is null or v_service.id is null then
    return jsonb_build_object('ok', false, 'error', 'Nao foi possivel confirmar esse agendamento.');
  end if;

  if v_org.booking_confirmation_mode = 'AUTOMATIC' then
    v_status_v2 := 'confirmed';
    v_status := 'CONFIRMED';
  else
    v_status_v2 := 'awaiting_confirmation';
    v_status := 'REQUESTED';
  end if;

  insert into public.appointments (
    organization_id, service_id, professional_id, customer_name, customer_email, customer_phone,
    starts_at, ends_at, occupied_starts_at, occupied_ends_at, status, status_v2, source,
    notes, hold_id, timezone, consent_whatsapp, consent_whatsapp_at, consent_origin
  ) values (
    v_hold.organization_id, v_hold.service_id, v_hold.professional_id, p_customer_name, nullif(p_customer_email, ''), p_customer_phone,
    v_hold.starts_at, v_hold.ends_at, v_hold.occupied_starts_at, v_hold.occupied_ends_at, v_status, v_status_v2, 'showcase',
    nullif(p_notes, ''), v_hold.id, v_org.timezone, p_consent_whatsapp,
    case when p_consent_whatsapp then now() else null end, nullif(p_consent_origin, '')
  )
  returning * into v_appointment;

  update public.appointment_holds set status = 'BOOKED' where id = v_hold.id;

  insert into public.appointment_history(organization_id, appointment_id, event_type, actor_type, metadata)
  values (v_appointment.organization_id, v_appointment.id, 'appointment_created', 'public_client',
    jsonb_build_object('status', v_status_v2, 'hold_id', v_hold.id));

  insert into public.reminder_jobs(organization_id, appointment_id, channel, scheduled_at, status, idempotency_key, payload)
  values (
    v_appointment.organization_id,
    v_appointment.id,
    'WHATSAPP',
    now(),
    case when p_consent_whatsapp then 'SCHEDULED'::public.reminder_job_status else 'SKIPPED'::public.reminder_job_status end,
    'appointment-confirmation:' || v_appointment.id::text,
    jsonb_build_object('template_key', case when v_status_v2 = 'confirmed' then 'appointment_confirmed' else 'appointment_awaiting_confirmation' end)
  )
  on conflict (idempotency_key) do nothing;

  return jsonb_build_object(
    'ok', true,
    'appointment_id', v_appointment.id,
    'public_token', v_appointment.public_token,
    'status', v_status_v2
  );
end;
$$;

create or replace function public.get_public_appointment_summary(p_public_token uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', a.id,
    'status', a.status_v2,
    'customer_name', a.customer_name,
    'customer_phone', a.customer_phone,
    'starts_at', a.starts_at,
    'ends_at', a.ends_at,
    'timezone', a.timezone,
    'organization', jsonb_build_object('name', o.name, 'slug', o.slug, 'address', coalesce(o.address, ''), 'city', coalesce(o.city, ''), 'state', coalesce(o.state, ''), 'whatsapp', coalesce(o.whatsapp, '')),
    'service', jsonb_build_object('name', coalesce(s.name, 'Servico'), 'duration_minutes', coalesce(s.duration_minutes, 60)),
    'professional', jsonb_build_object('name', coalesce(p.name, 'Profissional disponivel'))
  )
  from public.appointments a
  join public.organizations o on o.id = a.organization_id
  left join public.services s on s.id = a.service_id
  left join public.professionals p on p.id = a.professional_id
  where a.public_token = p_public_token
  limit 1;
$$;

create or replace function public.get_public_busy_times(p_organization_id uuid, p_until timestamptz)
returns table (
  professional_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  kind text
)
language sql
security definer
set search_path = public
as $$
  select a.professional_id, a.occupied_starts_at, a.occupied_ends_at, 'appointment'
  from public.appointments a
  where a.organization_id = p_organization_id
    and a.status_v2 not in ('cancelled_by_customer','cancelled_by_company','no_show')
    and a.occupied_ends_at >= now()
    and a.occupied_starts_at <= p_until
  union all
  select b.professional_id, b.starts_at, b.ends_at, 'blocked'
  from public.blocked_times b
  where b.organization_id = p_organization_id
    and b.ends_at >= now()
    and b.starts_at <= p_until
  union all
  select h.professional_id, h.occupied_starts_at, h.occupied_ends_at, 'hold'
  from public.appointment_holds h
  where h.organization_id = p_organization_id
    and h.status = 'TEMPORARILY_HELD'
    and h.expires_at > now()
    and h.occupied_ends_at >= now()
    and h.occupied_starts_at <= p_until;
$$;

revoke execute on function public.create_public_appointment_hold(uuid, uuid, uuid, timestamptz, timestamptz, timestamptz, timestamptz) from public;
revoke execute on function public.confirm_public_appointment_from_hold(uuid, uuid, text, text, text, text, boolean, text) from public;
revoke execute on function public.get_public_appointment_summary(uuid) from public;
revoke execute on function public.get_public_busy_times(uuid, timestamptz) from public;
grant execute on function public.create_public_appointment_hold(uuid, uuid, uuid, timestamptz, timestamptz, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.confirm_public_appointment_from_hold(uuid, uuid, text, text, text, text, boolean, text) to anon, authenticated;
grant execute on function public.get_public_appointment_summary(uuid) to anon, authenticated;
grant execute on function public.get_public_busy_times(uuid, timestamptz) to anon, authenticated;
