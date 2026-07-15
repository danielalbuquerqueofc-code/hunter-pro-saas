create extension if not exists pgcrypto;

create schema if not exists app_private;

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

create type public.member_status as enum ('INVITED', 'ACTIVE', 'SUSPENDED');
create type public.organization_status as enum ('ACTIVE', 'SUSPENDED', 'CANCELED');
create type public.subscription_status as enum ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  is_super_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  price_cents integer not null default 0 check (price_cents >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status public.organization_status not null default 'ACTIVE',
  owner_id uuid references public.profiles(id) on delete set null,
  plan_id uuid references public.plans(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_slug_format check (slug ~ '^[a-z0-9-]{3,80}$')
);

create table public.organization_members (
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

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  status public.subscription_status not null default 'ACTIVE',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index profiles_super_admin_idx on public.profiles(is_super_admin);
create index organizations_owner_id_idx on public.organizations(owner_id);
create index organizations_status_idx on public.organizations(status);
create index organization_members_org_idx on public.organization_members(organization_id);
create index organization_members_user_idx on public.organization_members(user_id);
create index subscriptions_org_idx on public.subscriptions(organization_id);
create index audit_logs_org_created_idx on public.audit_logs(organization_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger plans_set_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger organization_members_set_updated_at
before update on public.organization_members
for each row execute function public.set_updated_at();

create trigger subscriptions_set_updated_at
before update on public.subscriptions
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

create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = (select auth.uid())
      and om.status = 'ACTIVE'
  );
$$;

create or replace function public.has_org_role(
  p_organization_id uuid,
  p_roles public.member_role[]
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
    where om.organization_id = p_organization_id
      and om.user_id = (select auth.uid())
      and om.status = 'ACTIVE'
      and om.role = any(p_roles)
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

create policy "profiles_select_own_or_super_admin"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()) or public.is_super_admin());

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()) and is_super_admin = false);

create policy "plans_select_public"
on public.plans
for select
to anon, authenticated
using (is_active = true);

create policy "plans_manage_super_admin"
on public.plans
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "organizations_select_public_active"
on public.organizations
for select
to anon
using (status = 'ACTIVE');

create policy "organizations_select_member_or_super_admin"
on public.organizations
for select
to authenticated
using (public.is_org_member(id) or public.is_super_admin());

create policy "organizations_insert_authenticated"
on public.organizations
for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "organizations_update_owner_admin_or_super_admin"
on public.organizations
for update
to authenticated
using (
  public.has_org_role(id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
);

create policy "organization_members_select_same_org"
on public.organization_members
for select
to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "organization_members_insert_owner_admin"
on public.organization_members
for insert
to authenticated
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
);

create policy "organization_members_update_owner_admin"
on public.organization_members
for update
to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
);

create policy "subscriptions_select_member_or_super_admin"
on public.subscriptions
for select
to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "subscriptions_manage_super_admin"
on public.subscriptions
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "audit_logs_select_admins"
on public.audit_logs
for select
to authenticated
using (
  organization_id is not null
  and (
    public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
    or public.is_super_admin()
  )
);

create policy "audit_logs_insert_members"
on public.audit_logs
for insert
to authenticated
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
