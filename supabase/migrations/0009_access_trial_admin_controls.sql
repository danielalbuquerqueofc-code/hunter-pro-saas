-- Hunter Pro SaaS - access control, 5-day trial and admin audit.
-- Defensive migration: adds only missing columns and preserves existing data.

alter table public.organizations add column if not exists access_status text;
alter table public.organizations add column if not exists trial_started_at timestamptz;
alter table public.organizations add column if not exists trial_ends_at timestamptz;
alter table public.organizations add column if not exists activated_at timestamptz;
alter table public.organizations add column if not exists blocked_at timestamptz;
alter table public.organizations add column if not exists blocked_by uuid references auth.users(id) on delete set null;
alter table public.organizations add column if not exists blocked_reason text;
alter table public.organizations add column if not exists admin_notes text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'organizations_access_status_check'
      and conrelid = 'public.organizations'::regclass
  ) then
    alter table public.organizations
      add constraint organizations_access_status_check
      check (access_status in ('trial', 'active', 'suspended', 'trial_expired', 'blocked', 'cancelled'));
  end if;
end $$;

update public.organizations
set
  access_status = coalesce(access_status, 'active'),
  trial_started_at = coalesce(trial_started_at, created_at, now()),
  trial_ends_at = coalesce(trial_ends_at, created_at + interval '5 days', now() + interval '5 days'),
  activated_at = case
    when coalesce(access_status, 'active') = 'active' then coalesce(activated_at, created_at, now())
    else activated_at
  end
where access_status is null
   or trial_started_at is null
   or trial_ends_at is null;

alter table public.organizations alter column access_status set default 'trial';
alter table public.organizations alter column access_status set not null;
alter table public.organizations alter column trial_started_at set default now();
alter table public.organizations alter column trial_ends_at set default (now() + interval '5 days');

create index if not exists organizations_access_status_idx on public.organizations(access_status);
create index if not exists organizations_trial_ends_at_idx on public.organizations(trial_ends_at);
create index if not exists organizations_blocked_at_idx on public.organizations(blocked_at);

create or replace function public.create_organization_for_current_user(
  p_name text,
  p_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  new_organization_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  insert into public.organizations (
    name,
    slug,
    owner_id,
    status,
    subscription_status,
    access_status,
    trial_started_at,
    trial_ends_at
  )
  values (
    p_name,
    p_slug,
    auth.uid(),
    'ACTIVE',
    'TRIALING',
    'trial',
    now(),
    now() + interval '5 days'
  )
  returning id into new_organization_id;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (new_organization_id, auth.uid(), 'OWNER', 'ACTIVE')
  on conflict (organization_id, user_id) do update set
    role = excluded.role,
    status = excluded.status,
    updated_at = now();

  insert into public.audit_logs (
    organization_id,
    actor_id,
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    new_organization_id,
    auth.uid(),
    auth.uid(),
    'organization.created',
    'organization',
    new_organization_id,
    jsonb_build_object('trial_days', 5, 'access_status', 'trial')
  );

  return new_organization_id;
end;
$$;

grant execute on function public.create_organization_for_current_user(text, text) to authenticated;

create or replace function public.expire_organization_trials()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count integer;
begin
  with expired as (
    update public.organizations
    set
      access_status = 'trial_expired',
      status = 'SUSPENDED',
      subscription_status = 'PAST_DUE',
      blocked_at = now(),
      blocked_reason = coalesce(blocked_reason, 'Periodo gratis de 5 dias encerrado.'),
      updated_at = now()
    where access_status = 'trial'
      and trial_ends_at <= now()
    returning id
  ),
  audit as (
    insert into public.audit_logs (
      organization_id,
      actor_id,
      user_id,
      action,
      entity_type,
      entity_id,
      metadata
    )
    select
      id,
      null,
      null,
      'organization.trial_expired',
      'organization',
      id,
      jsonb_build_object('expired_by', 'expire_organization_trials')
    from expired
  ),
  notice as (
    insert into public.notifications (
      organization_id,
      user_id,
      status,
      type,
      title,
      body,
      message,
      action_url
    )
    select
      id,
      null,
      'UNREAD',
      'organization_access',
      'Teste gratis encerrado',
      'O periodo gratis de 5 dias terminou. Escolha um plano para liberar o painel.',
      'O periodo gratis de 5 dias terminou. Escolha um plano para liberar o painel.',
      '/precos'
    from expired
  )
  select count(*) into expired_count from expired;

  return expired_count;
end;
$$;

revoke execute on function public.expire_organization_trials() from public, anon, authenticated;
grant execute on function public.expire_organization_trials() to service_role;
