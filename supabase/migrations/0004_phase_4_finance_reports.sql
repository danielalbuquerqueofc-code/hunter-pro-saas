create type public.financial_transaction_type as enum ('INCOME', 'EXPENSE');
create type public.financial_transaction_status as enum ('PENDING', 'PAID', 'CANCELED');
create type public.financial_payment_method as enum (
  'PIX',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'BANK_TRANSFER',
  'CASH',
  'BOLETO',
  'OTHER'
);

create table public.financial_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type public.financial_transaction_type not null,
  name text not null,
  description text,
  color text not null default '#F74E14',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, type, name)
);

create table public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid references public.financial_categories(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  type public.financial_transaction_type not null,
  status public.financial_transaction_status not null default 'PENDING',
  payment_method public.financial_payment_method not null default 'OTHER',
  description text not null,
  amount_cents integer not null check (amount_cents > 0),
  due_date date,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index financial_categories_org_type_idx
on public.financial_categories(organization_id, type);

create index financial_transactions_org_due_idx
on public.financial_transactions(organization_id, due_date);

create index financial_transactions_org_status_idx
on public.financial_transactions(organization_id, status);

create index financial_transactions_org_type_idx
on public.financial_transactions(organization_id, type);

create trigger financial_categories_set_updated_at
before update on public.financial_categories
for each row execute function public.set_updated_at();

create trigger financial_transactions_set_updated_at
before update on public.financial_transactions
for each row execute function public.set_updated_at();

alter table public.financial_categories enable row level security;
alter table public.financial_transactions enable row level security;

create policy "financial_categories_select_finance"
on public.financial_categories
for select
to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','FINANCIAL']::public.member_role[])
  or public.is_super_admin()
);

create policy "financial_categories_manage_finance"
on public.financial_categories
for all
to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','FINANCIAL']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','FINANCIAL']::public.member_role[])
  or public.is_super_admin()
);

create policy "financial_transactions_select_finance"
on public.financial_transactions
for select
to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','FINANCIAL']::public.member_role[])
  or public.is_super_admin()
);

create policy "financial_transactions_insert_finance"
on public.financial_transactions
for insert
to authenticated
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','FINANCIAL']::public.member_role[])
  or public.is_super_admin()
);

create policy "financial_transactions_update_finance"
on public.financial_transactions
for update
to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','FINANCIAL']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','FINANCIAL']::public.member_role[])
  or public.is_super_admin()
);

grant select, insert, update, delete on public.financial_categories to authenticated;
grant select, insert, update on public.financial_transactions to authenticated;
