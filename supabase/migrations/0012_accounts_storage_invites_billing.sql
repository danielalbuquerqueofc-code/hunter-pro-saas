alter table public.profiles add column if not exists whatsapp text;
alter table public.profiles add column if not exists job_title text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists locale text not null default 'pt-BR';
alter table public.profiles add column if not exists timezone text not null default 'America/Sao_Paulo';
alter table public.profiles add column if not exists date_format text not null default 'dd/MM/yyyy';
alter table public.profiles add column if not exists notification_preferences jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists last_seen_at timestamptz;

alter table public.organizations add column if not exists legal_name text;
alter table public.organizations add column if not exists document text;
alter table public.organizations add column if not exists state_registration text;
alter table public.organizations add column if not exists municipal_registration text;
alter table public.organizations add column if not exists billing_email text;
alter table public.organizations add column if not exists billing_phone text;
alter table public.organizations add column if not exists billing_address text;
alter table public.organizations add column if not exists billing_city text;
alter table public.organizations add column if not exists billing_state text;
alter table public.organizations add column if not exists billing_zip_code text;
alter table public.organizations add column if not exists billing_country text not null default 'BR';
alter table public.organizations add column if not exists stripe_customer_id text;
alter table public.organizations add column if not exists support_email text;
alter table public.organizations add column if not exists support_whatsapp text;

alter table public.plans add column if not exists stripe_price_id text;
alter table public.plans add column if not exists stripe_product_id text;
create unique index if not exists plans_stripe_price_id_unique_idx
on public.plans(stripe_price_id)
where stripe_price_id is not null;

alter table public.subscriptions add column if not exists stripe_subscription_id text;
alter table public.subscriptions add column if not exists stripe_customer_id text;
alter table public.subscriptions add column if not exists stripe_checkout_session_id text;
alter table public.subscriptions add column if not exists cancel_at_period_end boolean not null default false;
alter table public.subscriptions add column if not exists last_payment_at timestamptz;
alter table public.subscriptions add column if not exists last_payment_status text;
alter table public.subscriptions add column if not exists provider_payload jsonb not null default '{}'::jsonb;
create unique index if not exists subscriptions_stripe_subscription_id_unique_idx
on public.subscriptions(stripe_subscription_id)
where stripe_subscription_id is not null;

create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.member_role not null default 'ATTENDANT',
  status text not null default 'SENT' check (status in ('SENT','ACCEPTED','EXPIRED','CANCELED','FAILED')),
  invited_by uuid references public.profiles(id) on delete set null,
  invited_user_id uuid references public.profiles(id) on delete set null,
  provider_user_id uuid,
  provider_error text,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, email)
);

create index if not exists organization_invitations_org_status_idx
on public.organization_invitations(organization_id, status, created_at desc);

drop trigger if exists organization_invitations_set_updated_at on public.organization_invitations;
create trigger organization_invitations_set_updated_at
before update on public.organization_invitations
for each row execute function public.set_updated_at();

alter table public.organization_invitations enable row level security;

drop policy if exists "organization_invitations_select_admins" on public.organization_invitations;
create policy "organization_invitations_select_admins"
on public.organization_invitations
for select
to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
);

drop policy if exists "organization_invitations_insert_admins" on public.organization_invitations;
create policy "organization_invitations_insert_admins"
on public.organization_invitations
for insert
to authenticated
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
);

drop policy if exists "organization_invitations_update_admins" on public.organization_invitations;
create policy "organization_invitations_update_admins"
on public.organization_invitations
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

grant select, insert, update on public.organization_invitations to authenticated;

create or replace function public.can_manage_hunter_asset(p_object_name text)
returns boolean
language sql
stable
set search_path = public, storage
as $$
  select case
    when (storage.foldername(p_object_name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then (
        public.has_org_role(
          ((storage.foldername(p_object_name))[1])::uuid,
          array['OWNER','ADMIN','MANAGER']::public.member_role[]
        )
        or public.is_super_admin()
      )
    else false
  end;
$$;

revoke execute on function public.can_manage_hunter_asset(text) from public, anon;
grant execute on function public.can_manage_hunter_asset(text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hunter-assets',
  'hunter-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "hunter_assets_public_select" on storage.objects;
create policy "hunter_assets_public_select"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'hunter-assets');

drop policy if exists "hunter_assets_member_insert" on storage.objects;
create policy "hunter_assets_member_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'hunter-assets'
  and public.can_manage_hunter_asset(name)
);

drop policy if exists "hunter_assets_member_update" on storage.objects;
create policy "hunter_assets_member_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'hunter-assets'
  and public.can_manage_hunter_asset(name)
)
with check (
  bucket_id = 'hunter-assets'
  and public.can_manage_hunter_asset(name)
);

drop policy if exists "hunter_assets_member_delete" on storage.objects;
create policy "hunter_assets_member_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'hunter-assets'
  and public.can_manage_hunter_asset(name)
);
