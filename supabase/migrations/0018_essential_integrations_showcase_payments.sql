alter table public.showcases add column if not exists profile_image_url text;
alter table public.showcases add column if not exists favicon_url text;
alter table public.showcases add column if not exists commercial_name text;
alter table public.showcases add column if not exists slogan text;
alter table public.showcases add column if not exists accent_color text;
alter table public.showcases add column if not exists background_color text;
alter table public.showcases add column if not exists card_color text;
alter table public.showcases add column if not exists text_color text;
alter table public.showcases add column if not exists button_color text;
alter table public.showcases add column if not exists button_text_color text;
alter table public.showcases add column if not exists border_color text;
alter table public.showcases add column if not exists radius_style text not null default 'large'
  check (radius_style in ('soft','large','pill'));
alter table public.showcases add column if not exists shadow_style text not null default 'soft'
  check (shadow_style in ('none','soft','elevated'));
alter table public.showcases add column if not exists service_area text;
alter table public.showcases add column if not exists opening_hours_text text;
alter table public.showcases add column if not exists payment_methods_text text;
alter table public.showcases add column if not exists cta_primary_text text not null default 'Agendar agora';
alter table public.showcases add column if not exists cta_secondary_text text not null default 'Falar no WhatsApp';
alter table public.showcases add column if not exists section_visibility jsonb not null default
  '{"hero":true,"trust":true,"about":true,"services":true,"professionals":true,"gallery":true,"reviews":true,"promotions":true,"contact":true,"hours":true,"payments":true,"links":true,"cta":true,"footer":true}'::jsonb;
alter table public.showcases add column if not exists section_order jsonb not null default
  '["hero","trust","about","services","professionals","gallery","reviews","promotions","contact","hours","payments","links","cta","footer"]'::jsonb;
alter table public.showcases add column if not exists featured_service_ids jsonb not null default '[]'::jsonb;
alter table public.showcases add column if not exists trust_highlights jsonb not null default '[]'::jsonb;
alter table public.showcases add column if not exists custom_links jsonb not null default '[]'::jsonb;
alter table public.showcases add column if not exists updated_by uuid references public.profiles(id) on delete set null;
alter table public.showcases add column if not exists published_at timestamptz;

alter table public.showcases drop constraint if exists showcases_theme_key_check;
alter table public.showcases add constraint showcases_theme_key_check
check (theme_key in ('clean_light','premium_dark','beauty','wellness','professional_blue','gold','modern','elegant','minimal','dark','light','automotive','professional'));

create table if not exists public.organization_payment_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade unique,
  holder_name text,
  holder_document text,
  holder_document_encrypted text,
  bank_name text,
  bank_agency text,
  bank_account text,
  bank_account_encrypted text,
  account_type text check (account_type is null or account_type in ('CHECKING','SAVINGS','PAYMENT')),
  pix_key text,
  pix_key_encrypted text,
  pix_key_type text check (pix_key_type is null or pix_key_type in ('CPF','CNPJ','EMAIL','PHONE','RANDOM')),
  beneficiary_name text,
  payment_instructions text,
  default_deposit_cents integer check (default_deposit_cents is null or default_deposit_cents >= 0),
  default_deposit_percent numeric(5,2) check (default_deposit_percent is null or (default_deposit_percent >= 0 and default_deposit_percent <= 100)),
  payment_deadline_hours integer check (payment_deadline_hours is null or payment_deadline_hours >= 0),
  static_pix_qr_code_url text,
  send_payment_data_mode text not null default 'NEVER'
    check (send_payment_data_mode in ('NEVER','ALWAYS','DEPOSIT_ONLY','MANUAL_ONLY','PUBLIC_BOOKINGS')),
  public_visibility text not null default 'PIX_ONLY'
    check (public_visibility in ('PIX_ONLY','PIX_AND_BENEFICIARY','FULL_BANK_DETAILS','CUSTOM_INSTRUCTIONS','QR_CODE')),
  show_bank_details_publicly boolean not null default false,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create index if not exists organization_payment_settings_org_idx
on public.organization_payment_settings(organization_id);

alter table public.organization_payment_settings add column if not exists holder_document text;
alter table public.organization_payment_settings add column if not exists holder_document_encrypted text;
alter table public.organization_payment_settings add column if not exists bank_agency text;
alter table public.organization_payment_settings add column if not exists bank_account text;
alter table public.organization_payment_settings add column if not exists bank_account_encrypted text;
alter table public.organization_payment_settings add column if not exists pix_key_encrypted text;
alter table public.organization_payment_settings add column if not exists show_bank_details_publicly boolean not null default false;

drop trigger if exists organization_payment_settings_set_updated_at on public.organization_payment_settings;
create trigger organization_payment_settings_set_updated_at
before update on public.organization_payment_settings
for each row execute function public.set_updated_at();

alter table public.organization_payment_settings enable row level security;

drop policy if exists "organization_payment_settings_staff" on public.organization_payment_settings;
create policy "organization_payment_settings_staff"
on public.organization_payment_settings
for all
to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','FINANCIAL']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN','FINANCIAL']::public.member_role[])
  or public.is_super_admin()
);

grant select, insert, update, delete on public.organization_payment_settings to authenticated;

alter table public.appointments add column if not exists payment_status text not null default 'PAYMENT_NOT_REQUIRED'
  check (payment_status in ('PAYMENT_NOT_REQUIRED','PAYMENT_PENDING','PAYMENT_PROOF_SENT','PAYMENT_CONFIRMED','PAYMENT_REJECTED','PAYMENT_EXPIRED'));
alter table public.appointments add column if not exists payment_instructions_sent_at timestamptz;
alter table public.appointments add column if not exists payment_deposit_cents integer check (payment_deposit_cents is null or payment_deposit_cents >= 0);

alter table public.google_calendar_connections add column if not exists provider text not null default 'GOOGLE_CALENDAR';
alter table public.google_calendar_connections add column if not exists access_token_encrypted text;
alter table public.google_calendar_connections add column if not exists refresh_token_encrypted text;
alter table public.google_calendar_connections add column if not exists scopes text[] not null default '{}'::text[];
alter table public.google_calendar_connections add column if not exists connected_at timestamptz;
alter table public.google_calendar_connections add column if not exists disconnected_at timestamptz;
alter table public.google_calendar_connections add column if not exists sync_reminder_minutes integer[] not null default array[1440,120];
alter table public.google_calendar_connections add column if not exists selected_calendar_summary text;

create unique index if not exists google_calendar_connections_org_prof_unique_idx
on public.google_calendar_connections(organization_id, coalesce(professional_id, '00000000-0000-0000-0000-000000000000'::uuid));

do $$
begin
  if not exists (select 1 from pg_type where typname = 'integration_provider' and typnamespace = 'public'::regnamespace) then
    create type public.integration_provider as enum ('WHATSAPP','GOOGLE_CALENDAR','GOOGLE_SHEETS','META_ADS','EMAIL','WEBHOOK','ASAAS');
  end if;

  if not exists (select 1 from pg_type where typname = 'integration_status' and typnamespace = 'public'::regnamespace) then
    create type public.integration_status as enum ('DISCONNECTED','CONNECTED','ERROR','PENDING');
  end if;
end $$;

create table if not exists public.integrations (
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

create index if not exists integrations_org_provider_idx on public.integrations(organization_id, provider);

drop trigger if exists integrations_set_updated_at on public.integrations;
create trigger integrations_set_updated_at
before update on public.integrations
for each row execute function public.set_updated_at();

alter table public.integrations enable row level security;

drop policy if exists "integrations_select_admins" on public.integrations;
create policy "integrations_select_admins" on public.integrations for select to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
);

drop policy if exists "integrations_manage_admins" on public.integrations;
create policy "integrations_manage_admins" on public.integrations for all to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN']::public.member_role[])
  or public.is_super_admin()
);

grant select, insert, update, delete on public.integrations to authenticated;

alter table public.integrations add column if not exists public_config jsonb not null default '{}'::jsonb;
alter table public.integrations add column if not exists protected_config jsonb not null default '{}'::jsonb;
alter table public.integrations add column if not exists connected_at timestamptz;
alter table public.integrations add column if not exists disconnected_at timestamptz;
alter table public.integrations add column if not exists last_error text;
alter table public.integrations add column if not exists webhook_status text not null default 'NOT_CONFIGURED'
  check (webhook_status in ('NOT_CONFIGURED','CONNECTED','ERROR','DISCONNECTED'));

alter table public.subscriptions add column if not exists grace_days integer not null default 3 check (grace_days >= 0);
alter table public.subscriptions add column if not exists next_due_date date;
alter table public.subscriptions add column if not exists suspended_at timestamptz;
alter table public.subscriptions add column if not exists reactivated_at timestamptz;
alter table public.subscriptions add column if not exists gateway_status text;
