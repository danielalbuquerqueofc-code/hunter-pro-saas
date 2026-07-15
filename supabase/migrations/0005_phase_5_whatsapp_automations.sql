create type public.conversation_channel as enum ('WHATSAPP', 'EMAIL', 'INSTAGRAM', 'WEBCHAT', 'MANUAL');
create type public.conversation_status as enum ('OPEN', 'PENDING', 'CLOSED');
create type public.message_direction as enum ('INBOUND', 'OUTBOUND');
create type public.message_status as enum ('DRAFT', 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');
create type public.task_status as enum ('OPEN', 'IN_PROGRESS', 'DONE', 'CANCELED');
create type public.task_priority as enum ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
create type public.automation_status as enum ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');
create type public.integration_provider as enum ('WHATSAPP', 'GOOGLE_CALENDAR', 'GOOGLE_SHEETS', 'META_ADS', 'EMAIL', 'PAYMENT', 'OPENAI', 'WEBHOOK');
create type public.integration_status as enum ('DISCONNECTED', 'CONNECTED', 'ERROR');
create type public.notification_status as enum ('UNREAD', 'READ', 'ARCHIVED');

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  channel public.conversation_channel not null default 'MANUAL',
  status public.conversation_status not null default 'OPEN',
  subject text,
  last_message_at timestamptz,
  lgpd_context text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  direction public.message_direction not null,
  status public.message_status not null default 'DRAFT',
  body text not null,
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  status public.task_status not null default 'OPEN',
  priority public.task_priority not null default 'MEDIUM',
  title text not null,
  description text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.automations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  status public.automation_status not null default 'DRAFT',
  trigger_key text not null,
  conditions jsonb not null default '{}'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider public.integration_provider not null,
  status public.integration_status not null default 'DISCONNECTED',
  display_name text not null,
  public_config jsonb not null default '{}'::jsonb,
  secret_ref text,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider, display_name)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  status public.notification_status not null default 'UNREAD',
  title text not null,
  body text,
  action_url text,
  created_at timestamptz not null default now()
);

create index conversations_org_status_idx on public.conversations(organization_id, status);
create index conversations_contact_idx on public.conversations(contact_id);
create index messages_org_conversation_idx on public.messages(organization_id, conversation_id, created_at);
create index tasks_org_status_due_idx on public.tasks(organization_id, status, due_at);
create index automations_org_status_idx on public.automations(organization_id, status);
create index integrations_org_provider_idx on public.integrations(organization_id, provider);
create index notifications_user_status_idx on public.notifications(user_id, status);

create trigger conversations_set_updated_at before update on public.conversations for each row execute function public.set_updated_at();
create trigger messages_set_updated_at before update on public.messages for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks for each row execute function public.set_updated_at();
create trigger automations_set_updated_at before update on public.automations for each row execute function public.set_updated_at();
create trigger integrations_set_updated_at before update on public.integrations for each row execute function public.set_updated_at();

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.tasks enable row level security;
alter table public.automations enable row level security;
alter table public.integrations enable row level security;
alter table public.notifications enable row level security;

create policy "conversations_select_staff" on public.conversations for select to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "conversations_manage_staff" on public.conversations for all to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SALES','ATTENDANT']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SALES','ATTENDANT']::public.member_role[])
  or public.is_super_admin()
);

create policy "messages_select_staff" on public.messages for select to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "messages_manage_staff" on public.messages for all to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SALES','ATTENDANT']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SALES','ATTENDANT']::public.member_role[])
  or public.is_super_admin()
);

create policy "tasks_select_members" on public.tasks for select to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "tasks_manage_members" on public.tasks for all to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin())
with check (public.is_org_member(organization_id) or public.is_super_admin());

create policy "automations_select_admins" on public.automations for select to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']::public.member_role[])
  or public.is_super_admin()
);

create policy "automations_manage_admins" on public.automations for all to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']::public.member_role[])
  or public.is_super_admin()
);

create policy "integrations_select_admins" on public.integrations for select to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
);

create policy "integrations_manage_admins" on public.integrations for all to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
);

create policy "notifications_select_own" on public.notifications for select to authenticated
using (user_id = (select auth.uid()) or public.is_super_admin());

create policy "notifications_update_own" on public.notifications for update to authenticated
using (user_id = (select auth.uid()) or public.is_super_admin())
with check (user_id = (select auth.uid()) or public.is_super_admin());

grant select, insert, update on public.conversations to authenticated;
grant select, insert, update on public.messages to authenticated;
grant select, insert, update on public.tasks to authenticated;
grant select, insert, update, delete on public.automations to authenticated;
grant select, insert, update, delete on public.integrations to authenticated;
grant select, update on public.notifications to authenticated;
