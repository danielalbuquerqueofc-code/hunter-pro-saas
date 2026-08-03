alter table public.audit_logs add column if not exists target_user_id uuid references public.profiles(id) on delete set null;
alter table public.audit_logs add column if not exists previous_values jsonb;
alter table public.audit_logs add column if not exists new_values jsonb;
alter table public.audit_logs add column if not exists reason text;
alter table public.audit_logs add column if not exists user_agent text;

alter table public.plans add column if not exists billing_period text not null default 'monthly'
  check (billing_period in ('monthly','quarterly','semiannual','annual'));
alter table public.plans add column if not exists professional_limit integer check (professional_limit is null or professional_limit >= 0);
alter table public.plans add column if not exists service_limit integer check (service_limit is null or service_limit >= 0);
alter table public.plans add column if not exists appointment_limit integer check (appointment_limit is null or appointment_limit >= 0);
alter table public.plans add column if not exists storage_limit_mb integer check (storage_limit_mb is null or storage_limit_mb >= 0);
alter table public.plans add column if not exists enabled_modules jsonb not null default '[]'::jsonb;

create table if not exists public.organization_limit_overrides (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  limit_key text not null check (limit_key in ('users','professionals','services','appointments','storage_mb')),
  limit_value integer not null check (limit_value >= 0),
  reason text not null,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_limit_overrides_org_key_idx
on public.organization_limit_overrides(organization_id, limit_key, expires_at);

create table if not exists public.admin_impersonation_sessions (
  id uuid primary key default gen_random_uuid(),
  super_admin_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  ended_at timestamptz,
  reason text not null,
  user_agent text,
  ip_address inet,
  created_at timestamptz not null default now(),
  constraint admin_impersonation_time_check check (started_at < expires_at)
);

create index if not exists admin_impersonation_sessions_admin_idx
on public.admin_impersonation_sessions(super_admin_id, started_at desc);

create index if not exists admin_impersonation_sessions_org_idx
on public.admin_impersonation_sessions(organization_id, started_at desc);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  provider text not null default 'MANUAL' check (provider in ('ASAAS','STRIPE','MANUAL')),
  external_id text,
  amount_cents integer not null check (amount_cents >= 0),
  status text not null default 'pending' check (status in ('pending','paid','overdue','cancelled','refunded','failed')),
  due_date date,
  paid_at timestamptz,
  payment_method text,
  invoice_url text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payments_provider_external_unique_idx
on public.payments(provider, external_id)
where external_id is not null;

create index if not exists payments_org_due_idx
on public.payments(organization_id, due_date desc);

drop trigger if exists organization_limit_overrides_set_updated_at on public.organization_limit_overrides;
create trigger organization_limit_overrides_set_updated_at
before update on public.organization_limit_overrides
for each row execute function public.set_updated_at();

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

alter table public.organization_limit_overrides enable row level security;
alter table public.admin_impersonation_sessions enable row level security;
alter table public.payments enable row level security;

drop policy if exists "organization_limit_overrides_super_admin" on public.organization_limit_overrides;
create policy "organization_limit_overrides_super_admin"
on public.organization_limit_overrides
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "organization_limit_overrides_org_admins_select" on public.organization_limit_overrides;
create policy "organization_limit_overrides_org_admins_select"
on public.organization_limit_overrides
for select
to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
);

drop policy if exists "admin_impersonation_sessions_super_admin" on public.admin_impersonation_sessions;
create policy "admin_impersonation_sessions_super_admin"
on public.admin_impersonation_sessions
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "payments_super_admin" on public.payments;
create policy "payments_super_admin"
on public.payments
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "payments_finance_select" on public.payments;
create policy "payments_finance_select"
on public.payments
for select
to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','FINANCIAL']::public.member_role[])
  or public.is_super_admin()
);

grant select, insert, update, delete on public.organization_limit_overrides to authenticated;
grant select, insert, update on public.admin_impersonation_sessions to authenticated;
grant select, insert, update on public.payments to authenticated;
