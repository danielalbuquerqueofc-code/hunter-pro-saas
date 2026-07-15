create type public.contact_type as enum ('LEAD', 'CUSTOMER', 'PARTNER', 'SUPPLIER');
create type public.contact_status as enum ('NEW', 'ACTIVE', 'INACTIVE', 'ARCHIVED');
create type public.deal_status as enum ('OPEN', 'WON', 'LOST', 'ARCHIVED');
create type public.deal_activity_type as enum ('NOTE', 'CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'TASK');

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  type public.contact_type not null default 'LEAD',
  status public.contact_status not null default 'NEW',
  name text not null,
  email text,
  phone text,
  company_name text,
  document_number text,
  source text,
  lgpd_consent_at timestamptz,
  lgpd_consent_source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contact_tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  color text not null default '#F74E14',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.contact_tag_links (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  tag_id uuid not null references public.contact_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (contact_id, tag_id)
);

create table public.pipelines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  probability integer not null default 0 check (probability between 0 and 100),
  is_won boolean not null default false,
  is_lost boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  pipeline_id uuid not null references public.pipelines(id) on delete restrict,
  stage_id uuid not null references public.pipeline_stages(id) on delete restrict,
  contact_id uuid references public.contacts(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  title text not null,
  value_cents integer not null default 0 check (value_cents >= 0),
  status public.deal_status not null default 'OPEN',
  expected_close_date date,
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.deal_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type public.deal_activity_type not null default 'NOTE',
  title text not null,
  body text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deal_activities_target_check check (deal_id is not null or contact_id is not null)
);

create index contacts_org_status_idx on public.contacts(organization_id, status);
create index contacts_org_type_idx on public.contacts(organization_id, type);
create index contacts_email_idx on public.contacts(email);
create index contacts_phone_idx on public.contacts(phone);
create index contact_tags_org_idx on public.contact_tags(organization_id);
create index contact_tag_links_org_idx on public.contact_tag_links(organization_id);
create index pipelines_org_idx on public.pipelines(organization_id);
create index pipeline_stages_pipeline_position_idx on public.pipeline_stages(pipeline_id, position);
create index deals_org_status_idx on public.deals(organization_id, status);
create index deals_stage_idx on public.deals(stage_id);
create index deals_contact_idx on public.deals(contact_id);
create index deal_activities_org_created_idx on public.deal_activities(organization_id, created_at desc);
create index deal_activities_due_idx on public.deal_activities(due_at);

create trigger contacts_set_updated_at
before update on public.contacts
for each row execute function public.set_updated_at();

create trigger contact_tags_set_updated_at
before update on public.contact_tags
for each row execute function public.set_updated_at();

create trigger pipelines_set_updated_at
before update on public.pipelines
for each row execute function public.set_updated_at();

create trigger pipeline_stages_set_updated_at
before update on public.pipeline_stages
for each row execute function public.set_updated_at();

create trigger deals_set_updated_at
before update on public.deals
for each row execute function public.set_updated_at();

create trigger deal_activities_set_updated_at
before update on public.deal_activities
for each row execute function public.set_updated_at();

alter table public.contacts enable row level security;
alter table public.contact_tags enable row level security;
alter table public.contact_tag_links enable row level security;
alter table public.pipelines enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.deals enable row level security;
alter table public.deal_activities enable row level security;

create policy "contacts_select_members"
on public.contacts
for select
to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "contacts_insert_staff"
on public.contacts
for insert
to authenticated
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SALES','ATTENDANT']::public.member_role[])
  or public.is_super_admin()
);

create policy "contacts_update_staff"
on public.contacts
for update
to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SALES','ATTENDANT']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SALES','ATTENDANT']::public.member_role[])
  or public.is_super_admin()
);

create policy "contact_tags_select_members"
on public.contact_tags
for select
to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "contact_tags_manage_staff"
on public.contact_tags
for all
to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SALES']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SALES']::public.member_role[])
  or public.is_super_admin()
);

create policy "contact_tag_links_select_members"
on public.contact_tag_links
for select
to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "contact_tag_links_manage_staff"
on public.contact_tag_links
for all
to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SALES']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SALES']::public.member_role[])
  or public.is_super_admin()
);

create policy "pipelines_select_members"
on public.pipelines
for select
to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "pipelines_manage_admins"
on public.pipelines
for all
to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']::public.member_role[])
  or public.is_super_admin()
);

create policy "pipeline_stages_select_members"
on public.pipeline_stages
for select
to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "pipeline_stages_manage_admins"
on public.pipeline_stages
for all
to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']::public.member_role[])
  or public.is_super_admin()
);

create policy "deals_select_members"
on public.deals
for select
to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "deals_insert_sales"
on public.deals
for insert
to authenticated
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SALES']::public.member_role[])
  or public.is_super_admin()
);

create policy "deals_update_sales"
on public.deals
for update
to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SALES']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SALES']::public.member_role[])
  or public.is_super_admin()
);

create policy "deal_activities_select_members"
on public.deal_activities
for select
to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "deal_activities_manage_staff"
on public.deal_activities
for all
to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SALES','ATTENDANT']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SALES','ATTENDANT']::public.member_role[])
  or public.is_super_admin()
);

grant select, insert, update on public.contacts to authenticated;
grant select, insert, update, delete on public.contact_tags to authenticated;
grant select, insert, update, delete on public.contact_tag_links to authenticated;
grant select, insert, update, delete on public.pipelines to authenticated;
grant select, insert, update, delete on public.pipeline_stages to authenticated;
grant select, insert, update on public.deals to authenticated;
grant select, insert, update, delete on public.deal_activities to authenticated;
