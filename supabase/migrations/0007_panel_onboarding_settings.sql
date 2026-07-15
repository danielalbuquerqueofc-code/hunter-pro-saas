alter table public.organizations add column if not exists logo_url text;
alter table public.organizations add column if not exists cover_url text;
alter table public.organizations add column if not exists phone text;
alter table public.organizations add column if not exists whatsapp text;
alter table public.organizations add column if not exists email text;
alter table public.organizations add column if not exists description text;
alter table public.organizations add column if not exists address text;
alter table public.organizations add column if not exists city text;
alter table public.organizations add column if not exists state text;
alter table public.organizations add column if not exists zip_code text;
alter table public.organizations add column if not exists subscription_status public.subscription_status not null default 'ACTIVE';

alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists avatar_url text;

create table if not exists public.onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  current_step integer not null default 0 check (current_step >= 0),
  completed_steps jsonb not null default '[]'::jsonb,
  dismissed boolean not null default false,
  onboarding_started_at timestamptz not null default now(),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.organization_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  primary_color text not null default '#F74E14',
  timezone text not null default 'America/Sao_Paulo',
  currency text not null default 'BRL',
  onboarding_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  create type public.notification_status as enum ('UNREAD', 'READ', 'ARCHIVED');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  status public.notification_status not null default 'UNREAD',
  title text not null default 'Notificacao',
  body text,
  action_url text,
  created_at timestamptz not null default now()
);

alter table public.notifications add column if not exists message text;
alter table public.notifications add column if not exists type text not null default 'INFO';
alter table public.notifications add column if not exists read_at timestamptz;
alter table public.notifications add column if not exists updated_at timestamptz not null default now();

update public.notifications
set message = coalesce(message, body)
where message is null;

alter table public.audit_logs add column if not exists user_id uuid references public.profiles(id) on delete set null;
alter table public.audit_logs add column if not exists ip_address inet;

create index if not exists onboarding_progress_org_user_idx on public.onboarding_progress(organization_id, user_id);
create index if not exists organization_settings_org_idx on public.organization_settings(organization_id);
create index if not exists notifications_org_user_read_idx on public.notifications(organization_id, user_id, read_at);

drop trigger if exists onboarding_progress_set_updated_at on public.onboarding_progress;
create trigger onboarding_progress_set_updated_at
before update on public.onboarding_progress
for each row execute function public.set_updated_at();

drop trigger if exists organization_settings_set_updated_at on public.organization_settings;
create trigger organization_settings_set_updated_at
before update on public.organization_settings
for each row execute function public.set_updated_at();

drop trigger if exists notifications_set_updated_at on public.notifications;
create trigger notifications_set_updated_at
before update on public.notifications
for each row execute function public.set_updated_at();

alter table public.onboarding_progress enable row level security;
alter table public.organization_settings enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "onboarding_progress_select_own_or_admin" on public.onboarding_progress;
create policy "onboarding_progress_select_own_or_admin"
on public.onboarding_progress
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
);

drop policy if exists "onboarding_progress_insert_own" on public.onboarding_progress;
create policy "onboarding_progress_insert_own"
on public.onboarding_progress
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and public.is_org_member(organization_id)
);

drop policy if exists "onboarding_progress_update_own_or_admin" on public.onboarding_progress;
create policy "onboarding_progress_update_own_or_admin"
on public.onboarding_progress
for update
to authenticated
using (
  user_id = (select auth.uid())
  or public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
)
with check (
  user_id = (select auth.uid())
  or public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
);

drop policy if exists "organization_settings_select_members" on public.organization_settings;
create policy "organization_settings_select_members"
on public.organization_settings
for select
to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

drop policy if exists "organization_settings_manage_admins" on public.organization_settings;
create policy "organization_settings_manage_admins"
on public.organization_settings
for all
to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
);

drop policy if exists "notifications_select_own_or_admin" on public.notifications;
create policy "notifications_select_own_or_admin"
on public.notifications
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
on public.notifications
for update
to authenticated
using (user_id = (select auth.uid()) or public.is_super_admin())
with check (user_id = (select auth.uid()) or public.is_super_admin());

grant select, insert, update on public.onboarding_progress to authenticated;
grant select, insert, update on public.organization_settings to authenticated;
grant select, update on public.notifications to authenticated;
