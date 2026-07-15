create extension if not exists pgcrypto;

create schema if not exists app_private;

do $$
begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'member_role') then
    create type public.member_role as enum (
      'SUPER_ADMIN',
      'OWNER',
      'ADMIN',
      'MANAGER',
      'SALES',
      'ATTENDANT',
      'PROFESSIONAL',
      'FINANCIAL'
    );
  end if;

  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'member_status') then
    create type public.member_status as enum ('INVITED', 'ACTIVE', 'SUSPENDED');
  end if;

  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'organization_status') then
    create type public.organization_status as enum ('ACTIVE', 'SUSPENDED', 'CANCELED');
  end if;

  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'subscription_status') then
    create type public.subscription_status as enum ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  is_super_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists is_super_admin boolean not null default false;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  price_cents integer not null default 0 check (price_cents >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status public.organization_status not null default 'ACTIVE',
  owner_id uuid references public.profiles(id) on delete set null,
  plan_id uuid references public.plans(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizations add column if not exists name text;
alter table public.organizations add column if not exists slug text;
alter table public.organizations add column if not exists status public.organization_status not null default 'ACTIVE';
alter table public.organizations add column if not exists owner_id uuid references public.profiles(id) on delete set null;
alter table public.organizations add column if not exists plan_id uuid references public.plans(id) on delete set null;
alter table public.organizations add column if not exists created_at timestamptz not null default now();
alter table public.organizations add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'organizations_slug_format'
      and conrelid = 'public.organizations'::regclass
  ) then
    alter table public.organizations
      add constraint organizations_slug_format check (slug ~ '^[a-z0-9-]{3,80}$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'organizations_slug_key'
      and conrelid = 'public.organizations'::regclass
  ) then
    alter table public.organizations add unique (slug);
  end if;
end $$;

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'OWNER',
  status public.member_status not null default 'ACTIVE',
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

alter table public.organization_members add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.organization_members add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.organization_members add column if not exists role public.member_role not null default 'OWNER';
alter table public.organization_members add column if not exists status public.member_status not null default 'ACTIVE';
alter table public.organization_members add column if not exists invited_by uuid references public.profiles(id) on delete set null;
alter table public.organization_members add column if not exists created_at timestamptz not null default now();
alter table public.organization_members add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organization_members'
      and column_name = 'role_id'
  ) then
    alter table public.organization_members alter column role_id drop not null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'organization_members_organization_id_user_id_key'
      and conrelid = 'public.organization_members'::regclass
  ) then
    alter table public.organization_members add unique (organization_id, user_id);
  end if;
end $$;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  status public.subscription_status not null default 'ACTIVE',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.subscriptions add column if not exists plan_id uuid references public.plans(id) on delete restrict;
alter table public.subscriptions add column if not exists status public.subscription_status not null default 'ACTIVE';
alter table public.subscriptions add column if not exists current_period_start timestamptz;
alter table public.subscriptions add column if not exists current_period_end timestamptz;
alter table public.subscriptions add column if not exists created_at timestamptz not null default now();
alter table public.subscriptions add column if not exists updated_at timestamptz not null default now();

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.audit_logs add column if not exists actor_id uuid references public.profiles(id) on delete set null;
alter table public.audit_logs add column if not exists action text;
alter table public.audit_logs add column if not exists entity_type text;
alter table public.audit_logs add column if not exists entity_id uuid;
alter table public.audit_logs add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.audit_logs add column if not exists created_at timestamptz not null default now();

create index if not exists profiles_super_admin_idx on public.profiles(is_super_admin);
create index if not exists organizations_owner_id_idx on public.organizations(owner_id);
create index if not exists organizations_status_idx on public.organizations(status);
create index if not exists organization_members_org_idx on public.organization_members(organization_id);
create index if not exists organization_members_user_idx on public.organization_members(user_id);
create index if not exists subscriptions_org_idx on public.subscriptions(organization_id);
create index if not exists audit_logs_org_created_idx on public.audit_logs(organization_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at before update on public.plans
for each row execute function public.set_updated_at();

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at before update on public.organizations
for each row execute function public.set_updated_at();

drop trigger if exists organization_members_set_updated_at on public.organization_members;
create trigger organization_members_set_updated_at before update on public.organization_members
for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function app_private.handle_new_user();

drop policy if exists "profiles_select_own_or_super_admin" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "plans_select_public" on public.plans;
drop policy if exists "plans_manage_super_admin" on public.plans;
drop policy if exists "organizations_select_public_active" on public.organizations;
drop policy if exists "organizations_select_member_or_super_admin" on public.organizations;
drop policy if exists "organizations_insert_authenticated" on public.organizations;
drop policy if exists "organizations_update_owner_admin_or_super_admin" on public.organizations;
drop policy if exists "organization_members_select_same_org" on public.organization_members;
drop policy if exists "organization_members_insert_owner_admin" on public.organization_members;
drop policy if exists "organization_members_update_owner_admin" on public.organization_members;
drop policy if exists "subscriptions_select_member_or_super_admin" on public.subscriptions;
drop policy if exists "subscriptions_manage_super_admin" on public.subscriptions;
drop policy if exists "audit_logs_select_admins" on public.audit_logs;
drop policy if exists "audit_logs_insert_members" on public.audit_logs;

drop function if exists public.create_organization_for_current_user(text, text);

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_super_admin = true
  );
$$;

create or replace function public.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = (select auth.uid())
      and om.status = 'ACTIVE'
  );
$$;

create or replace function public.has_org_role(
  target_organization_id uuid,
  allowed_roles public.member_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = (select auth.uid())
      and om.status = 'ACTIVE'
      and om.role = any(allowed_roles)
  );
$$;

create or replace function public.create_organization_for_current_user(
  p_name text,
  p_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan_id uuid;
  v_organization_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_slug !~ '^[a-z0-9-]{3,80}$' then
    raise exception 'Invalid slug';
  end if;

  select id into v_plan_id
  from public.plans
  where code = 'free'
  limit 1;

  insert into public.profiles (id)
  values (v_user_id)
  on conflict (id) do nothing;

  insert into public.organizations (name, slug, owner_id, plan_id)
  values (trim(p_name), lower(trim(p_slug)), v_user_id, v_plan_id)
  returning id into v_organization_id;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (v_organization_id, v_user_id, 'OWNER', 'ACTIVE');

  if v_plan_id is not null then
    insert into public.subscriptions (organization_id, plan_id, status)
    values (v_organization_id, v_plan_id, 'ACTIVE');
  end if;

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id)
  values (v_organization_id, v_user_id, 'organization.created', 'organization', v_organization_id);

  return v_organization_id;
end;
$$;

revoke execute on function public.is_super_admin() from public, anon;
revoke execute on function public.is_org_member(uuid) from public, anon;
revoke execute on function public.has_org_role(uuid, public.member_role[]) from public, anon;
revoke execute on function public.create_organization_for_current_user(text, text) from public, anon;

grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, public.member_role[]) to authenticated;
grant execute on function public.create_organization_for_current_user(text, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "profiles_select_own_or_super_admin" on public.profiles;
create policy "profiles_select_own_or_super_admin" on public.profiles
for select to authenticated
using (id = (select auth.uid()) or public.is_super_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()) and is_super_admin = false);

drop policy if exists "plans_select_public" on public.plans;
create policy "plans_select_public" on public.plans
for select to anon, authenticated
using (is_active = true);

drop policy if exists "plans_manage_super_admin" on public.plans;
create policy "plans_manage_super_admin" on public.plans
for all to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "organizations_select_public_active" on public.organizations;
create policy "organizations_select_public_active" on public.organizations
for select to anon
using (status = 'ACTIVE');

drop policy if exists "organizations_select_member_or_super_admin" on public.organizations;
create policy "organizations_select_member_or_super_admin" on public.organizations
for select to authenticated
using (public.is_org_member(id) or public.is_super_admin());

drop policy if exists "organizations_insert_authenticated" on public.organizations;
create policy "organizations_insert_authenticated" on public.organizations
for insert to authenticated
with check (owner_id = (select auth.uid()));

drop policy if exists "organizations_update_owner_admin_or_super_admin" on public.organizations;
create policy "organizations_update_owner_admin_or_super_admin" on public.organizations
for update to authenticated
using (
  public.has_org_role(id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
);

drop policy if exists "organization_members_select_same_org" on public.organization_members;
create policy "organization_members_select_same_org" on public.organization_members
for select to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

drop policy if exists "organization_members_insert_owner_admin" on public.organization_members;
create policy "organization_members_insert_owner_admin" on public.organization_members
for insert to authenticated
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
);

drop policy if exists "organization_members_update_owner_admin" on public.organization_members;
create policy "organization_members_update_owner_admin" on public.organization_members
for update to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
);

drop policy if exists "subscriptions_select_member_or_super_admin" on public.subscriptions;
create policy "subscriptions_select_member_or_super_admin" on public.subscriptions
for select to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

drop policy if exists "subscriptions_manage_super_admin" on public.subscriptions;
create policy "subscriptions_manage_super_admin" on public.subscriptions
for all to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "audit_logs_select_admins" on public.audit_logs;
create policy "audit_logs_select_admins" on public.audit_logs
for select to authenticated
using (
  organization_id is not null
  and (
    public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
    or public.is_super_admin()
  )
);

drop policy if exists "audit_logs_insert_members" on public.audit_logs;
create policy "audit_logs_insert_members" on public.audit_logs
for insert to authenticated
with check (
  organization_id is not null
  and actor_id = (select auth.uid())
  and public.is_org_member(organization_id)
);

grant usage on schema public to anon, authenticated;
grant select on public.plans to anon, authenticated;
grant select on public.organizations to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.organizations to authenticated;
grant select, insert, update on public.organization_members to authenticated;
grant select, insert, update on public.subscriptions to authenticated;
grant select, insert on public.audit_logs to authenticated;

insert into public.plans (code, name, description, price_cents)
values
  ('free', 'Free', 'Plano inicial para validar a operacao.', 0),
  ('pro', 'Pro', 'Plano principal para empresas em crescimento.', 9700),
  ('scale', 'Scale', 'Plano para operacoes com equipe maior.', 19700)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  is_active = true,
  updated_at = now();
