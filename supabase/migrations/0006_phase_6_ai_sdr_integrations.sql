create type public.ai_agent_status as enum ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');
create type public.ai_agent_goal as enum ('QUALIFY_LEADS', 'FOLLOW_UP', 'SUPPORT', 'SALES_ASSISTANT', 'OPERATIONS');
create type public.ai_run_status as enum ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED');
create type public.integration_event_status as enum ('RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED');

create table public.ai_agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  goal public.ai_agent_goal not null default 'QUALIFY_LEADS',
  status public.ai_agent_status not null default 'DRAFT',
  instructions text not null,
  guardrails text,
  allowed_channels public.conversation_channel[] not null default array['MANUAL']::public.conversation_channel[],
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_agent_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  ai_agent_id uuid not null references public.ai_agents(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  status public.ai_run_status not null default 'QUEUED',
  input_summary text,
  output_summary text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.integration_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  integration_id uuid references public.integrations(id) on delete set null,
  provider public.integration_provider not null,
  status public.integration_event_status not null default 'RECEIVED',
  event_key text not null,
  external_id text,
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index ai_agents_org_status_idx on public.ai_agents(organization_id, status);
create index ai_agent_runs_org_status_idx on public.ai_agent_runs(organization_id, status);
create index integration_events_org_provider_idx on public.integration_events(organization_id, provider, created_at desc);

create trigger ai_agents_set_updated_at before update on public.ai_agents for each row execute function public.set_updated_at();

alter table public.ai_agents enable row level security;
alter table public.ai_agent_runs enable row level security;
alter table public.integration_events enable row level security;

create policy "ai_agents_select_admins" on public.ai_agents for select to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']::public.member_role[])
  or public.is_super_admin()
);

create policy "ai_agents_manage_admins" on public.ai_agents for all to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
);

create policy "ai_agent_runs_select_admins" on public.ai_agent_runs for select to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']::public.member_role[])
  or public.is_super_admin()
);

create policy "ai_agent_runs_insert_admins" on public.ai_agent_runs for insert to authenticated
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']::public.member_role[])
  or public.is_super_admin()
);

create policy "integration_events_select_admins" on public.integration_events for select to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
);

create policy "integration_events_insert_admins" on public.integration_events for insert to authenticated
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
);

grant select, insert, update, delete on public.ai_agents to authenticated;
grant select, insert on public.ai_agent_runs to authenticated;
grant select, insert on public.integration_events to authenticated;
