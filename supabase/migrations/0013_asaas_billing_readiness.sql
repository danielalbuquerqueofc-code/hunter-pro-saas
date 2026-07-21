alter table public.organizations add column if not exists billing_provider text not null default 'STRIPE'
  check (billing_provider in ('STRIPE','ASAAS'));
alter table public.organizations add column if not exists asaas_customer_id text;

alter table public.plans add column if not exists billing_provider text not null default 'STRIPE'
  check (billing_provider in ('STRIPE','ASAAS'));
alter table public.plans add column if not exists asaas_billing_type text not null default 'PIX'
  check (asaas_billing_type in ('BOLETO','CREDIT_CARD','PIX','UNDEFINED'));
alter table public.plans add column if not exists asaas_cycle text not null default 'MONTHLY'
  check (asaas_cycle in ('WEEKLY','BIWEEKLY','MONTHLY','QUARTERLY','SEMIANNUALLY','YEARLY'));
alter table public.plans add column if not exists trial_days integer not null default 7 check (trial_days >= 0);
alter table public.plans add column if not exists annual_price_cents integer check (annual_price_cents >= 0);
alter table public.plans add column if not exists features jsonb not null default '{}'::jsonb;
alter table public.plans add column if not exists limits jsonb not null default '{}'::jsonb;
alter table public.plans add column if not exists is_featured boolean not null default false;
alter table public.plans add column if not exists sort_order integer not null default 0;
alter table public.plans add column if not exists archived_at timestamptz;

alter table public.subscriptions add column if not exists billing_provider text not null default 'STRIPE'
  check (billing_provider in ('STRIPE','ASAAS'));
alter table public.subscriptions add column if not exists asaas_customer_id text;
alter table public.subscriptions add column if not exists asaas_subscription_id text;
alter table public.subscriptions add column if not exists asaas_payment_id text;
alter table public.subscriptions add column if not exists asaas_invoice_url text;
alter table public.subscriptions add column if not exists asaas_bank_slip_url text;
alter table public.subscriptions add column if not exists asaas_status text;

create unique index if not exists organizations_asaas_customer_id_unique_idx
on public.organizations(asaas_customer_id)
where asaas_customer_id is not null;

create unique index if not exists subscriptions_asaas_subscription_id_unique_idx
on public.subscriptions(asaas_subscription_id)
where asaas_subscription_id is not null;

create unique index if not exists subscriptions_asaas_payment_id_unique_idx
on public.subscriptions(asaas_payment_id)
where asaas_payment_id is not null;

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  provider text not null check (provider in ('STRIPE','ASAAS')),
  event_id text not null,
  event_type text not null,
  status text not null default 'RECEIVED' check (status in ('RECEIVED','PROCESSED','IGNORED','FAILED')),
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, event_id)
);

create index if not exists billing_events_org_created_idx
on public.billing_events(organization_id, created_at desc);

drop trigger if exists billing_events_set_updated_at on public.billing_events;
create trigger billing_events_set_updated_at
before update on public.billing_events
for each row execute function public.set_updated_at();

alter table public.billing_events enable row level security;

drop policy if exists "billing_events_select_staff" on public.billing_events;
create policy "billing_events_select_staff"
on public.billing_events
for select
to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','FINANCIAL']::public.member_role[])
  or public.is_super_admin()
);

drop policy if exists "billing_events_insert_super_admin" on public.billing_events;
create policy "billing_events_insert_super_admin"
on public.billing_events
for insert
to authenticated
with check (public.is_super_admin());

grant select on public.billing_events to authenticated;
