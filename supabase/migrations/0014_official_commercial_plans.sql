alter table public.plans add column if not exists slug text;
alter table public.plans add column if not exists monthly_price numeric(10,2);
alter table public.plans add column if not exists minimum_users integer not null default 1 check (minimum_users >= 1);
alter table public.plans add column if not exists maximum_users integer not null default 1 check (maximum_users >= minimum_users);
alter table public.plans add column if not exists status text not null default 'active' check (status in ('active','inactive','archived'));
alter table public.plans add column if not exists display_order integer not null default 0;

update public.plans
set
  slug = coalesce(slug, lower(regexp_replace(code, '[^a-zA-Z0-9]+', '-', 'g'))),
  monthly_price = coalesce(monthly_price, round((price_cents::numeric / 100), 2)),
  status = case when is_active then 'active' else 'inactive' end,
  display_order = coalesce(nullif(display_order, 0), sort_order, 0),
  updated_at = now()
where slug is null
  or monthly_price is null
  or display_order = 0;

create unique index if not exists plans_slug_unique_idx
on public.plans(slug)
where archived_at is null;

create table if not exists public.plan_change_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  from_plan_id uuid references public.plans(id) on delete set null,
  to_plan_id uuid references public.plans(id) on delete set null,
  status text not null default 'applied' check (status in ('applied','blocked','pending','failed')),
  change_timing text not null default 'immediate' check (change_timing in ('immediate','next_cycle')),
  used_users integer not null default 0 check (used_users >= 0),
  target_user_limit integer not null default 1 check (target_user_limit >= 1),
  custom_monthly_price numeric(10,2),
  discount_percent numeric(5,2) check (discount_percent is null or (discount_percent >= 0 and discount_percent <= 100)),
  courtesy_until timestamptz,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists plan_change_history_org_created_idx
on public.plan_change_history(organization_id, created_at desc);

alter table public.plan_change_history enable row level security;

drop policy if exists "plan_change_history_select_staff" on public.plan_change_history;
create policy "plan_change_history_select_staff"
on public.plan_change_history
for select
to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','FINANCIAL']::public.member_role[])
  or public.is_super_admin()
);

drop policy if exists "plan_change_history_insert_super_admin" on public.plan_change_history;
create policy "plan_change_history_insert_super_admin"
on public.plan_change_history
for insert
to authenticated
with check (public.is_super_admin());

grant select on public.plan_change_history to authenticated;

insert into public.plans (
  code,
  slug,
  name,
  description,
  price_cents,
  monthly_price,
  minimum_users,
  maximum_users,
  trial_days,
  status,
  display_order,
  sort_order,
  is_featured,
  is_active,
  billing_provider,
  asaas_billing_type,
  asaas_cycle,
  limits,
  features,
  updated_at
)
values
  (
    'start',
    'start',
    'Start',
    'Para profissionais autonomos ou pequenos prestadores de servico. Inclui 1 conta de acesso vinculada a empresa.',
    9700,
    97.00,
    1,
    1,
    7,
    'active',
    10,
    10,
    false,
    true,
    'ASAAS',
    'PIX',
    'MONTHLY',
    '{"users": 1}'::jsonb,
    '{"positioning": "Profissional autonomo", "billing": "mensal"}'::jsonb,
    now()
  ),
  (
    'pro',
    'pro',
    'Pro',
    'Para pequenos negocios com responsavel e um colaborador. Inclui ate 2 contas de acesso.',
    19700,
    197.00,
    1,
    2,
    7,
    'active',
    20,
    20,
    true,
    true,
    'ASAAS',
    'PIX',
    'MONTHLY',
    '{"users": 2}'::jsonb,
    '{"positioning": "Pequeno negocio", "billing": "mensal"}'::jsonb,
    now()
  ),
  (
    'scale',
    'scale',
    'Scale',
    'Para empresas com equipe. Inclui de 3 ate 5 contas de acesso vinculadas a empresa.',
    29700,
    297.00,
    3,
    5,
    7,
    'active',
    30,
    30,
    false,
    true,
    'ASAAS',
    'PIX',
    'MONTHLY',
    '{"users": 5}'::jsonb,
    '{"positioning": "Empresa com equipe", "billing": "mensal"}'::jsonb,
    now()
  )
on conflict (code) do update set
  slug = excluded.slug,
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  monthly_price = excluded.monthly_price,
  minimum_users = excluded.minimum_users,
  maximum_users = excluded.maximum_users,
  trial_days = excluded.trial_days,
  status = excluded.status,
  display_order = excluded.display_order,
  sort_order = excluded.sort_order,
  is_featured = excluded.is_featured,
  is_active = excluded.is_active,
  billing_provider = excluded.billing_provider,
  asaas_billing_type = excluded.asaas_billing_type,
  asaas_cycle = excluded.asaas_cycle,
  limits = excluded.limits,
  features = excluded.features,
  updated_at = now();
