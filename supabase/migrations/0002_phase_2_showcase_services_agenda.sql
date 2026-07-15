create type public.showcase_status as enum ('DRAFT', 'PUBLISHED');
create type public.appointment_status as enum ('REQUESTED', 'CONFIRMED', 'CANCELED', 'DONE', 'NO_SHOW');

create table public.showcases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  title text not null,
  subtitle text,
  description text,
  hero_image_url text,
  primary_color text not null default '#F74E14',
  whatsapp text,
  instagram_url text,
  status public.showcase_status not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.showcase_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  showcase_id uuid not null references public.showcases(id) on delete cascade,
  label text not null,
  url text not null,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.showcase_gallery (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  showcase_id uuid not null references public.showcases(id) on delete cascade,
  image_url text not null,
  alt_text text,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid references public.service_categories(id) on delete set null,
  name text not null,
  description text,
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  price_cents integer not null default 0 check (price_cents >= 0),
  is_online boolean not null default true,
  is_active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text,
  phone text,
  bio text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.professional_services (
  professional_id uuid not null references public.professionals(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (professional_id, service_id)
);

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  professional_id uuid references public.professionals(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_rules_time_check check (start_time < end_time)
);

create table public.blocked_times (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  professional_id uuid references public.professionals(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blocked_times_range_check check (starts_at < ends_at)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  professional_id uuid references public.professionals(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'REQUESTED',
  source text not null default 'showcase',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_range_check check (starts_at < ends_at)
);

create index showcases_org_idx on public.showcases(organization_id);
create index showcase_links_org_position_idx on public.showcase_links(organization_id, position);
create index showcase_gallery_org_position_idx on public.showcase_gallery(organization_id, position);
create index service_categories_org_position_idx on public.service_categories(organization_id, position);
create index services_org_position_idx on public.services(organization_id, position);
create index professionals_org_idx on public.professionals(organization_id);
create index professional_services_org_idx on public.professional_services(organization_id);
create index availability_rules_org_weekday_idx on public.availability_rules(organization_id, weekday);
create index blocked_times_org_starts_idx on public.blocked_times(organization_id, starts_at);
create index appointments_org_starts_idx on public.appointments(organization_id, starts_at);
create index appointments_status_idx on public.appointments(status);

create trigger showcases_set_updated_at
before update on public.showcases
for each row execute function public.set_updated_at();

create trigger showcase_links_set_updated_at
before update on public.showcase_links
for each row execute function public.set_updated_at();

create trigger showcase_gallery_set_updated_at
before update on public.showcase_gallery
for each row execute function public.set_updated_at();

create trigger service_categories_set_updated_at
before update on public.service_categories
for each row execute function public.set_updated_at();

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

create trigger professionals_set_updated_at
before update on public.professionals
for each row execute function public.set_updated_at();

create trigger availability_rules_set_updated_at
before update on public.availability_rules
for each row execute function public.set_updated_at();

create trigger blocked_times_set_updated_at
before update on public.blocked_times
for each row execute function public.set_updated_at();

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

alter table public.showcases enable row level security;
alter table public.showcase_links enable row level security;
alter table public.showcase_gallery enable row level security;
alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.professionals enable row level security;
alter table public.professional_services enable row level security;
alter table public.availability_rules enable row level security;
alter table public.blocked_times enable row level security;
alter table public.appointments enable row level security;

create policy "showcases_public_published"
on public.showcases
for select
to anon, authenticated
using (status = 'PUBLISHED');

create policy "showcases_select_member_or_super_admin"
on public.showcases
for select
to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "showcases_manage_owner_admin"
on public.showcases
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

create policy "showcase_links_public_active"
on public.showcase_links
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1 from public.showcases s
    where s.id = showcase_links.showcase_id
      and s.status = 'PUBLISHED'
  )
);

create policy "showcase_links_select_member_or_super_admin"
on public.showcase_links
for select
to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "showcase_links_manage_owner_admin"
on public.showcase_links
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

create policy "showcase_gallery_public_active"
on public.showcase_gallery
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1 from public.showcases s
    where s.id = showcase_gallery.showcase_id
      and s.status = 'PUBLISHED'
  )
);

create policy "showcase_gallery_select_member_or_super_admin"
on public.showcase_gallery
for select
to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "showcase_gallery_manage_owner_admin"
on public.showcase_gallery
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

create policy "service_categories_public_active"
on public.service_categories
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.showcases s
    where s.organization_id = service_categories.organization_id
      and s.status = 'PUBLISHED'
  )
);

create policy "service_categories_select_member_or_super_admin"
on public.service_categories
for select
to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "service_categories_manage_staff"
on public.service_categories
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

create policy "services_public_active"
on public.services
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.showcases s
    where s.organization_id = services.organization_id
      and s.status = 'PUBLISHED'
  )
);

create policy "services_select_member_or_super_admin"
on public.services
for select
to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "services_manage_staff"
on public.services
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

create policy "professionals_select_org_or_public_active"
on public.professionals
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.showcases s
    where s.organization_id = professionals.organization_id
      and s.status = 'PUBLISHED'
  )
);

create policy "professionals_select_member_or_super_admin"
on public.professionals
for select
to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "professionals_manage_staff"
on public.professionals
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

create policy "professional_services_select_org_or_public"
on public.professional_services
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.services s
    join public.professionals p on p.organization_id = s.organization_id
    where s.id = professional_services.service_id
      and p.id = professional_services.professional_id
      and s.is_active = true
      and p.is_active = true
      and exists (
        select 1
        from public.showcases sh
        where sh.organization_id = professional_services.organization_id
          and sh.status = 'PUBLISHED'
      )
  )
);

create policy "professional_services_select_member_or_super_admin"
on public.professional_services
for select
to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "professional_services_manage_staff"
on public.professional_services
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

create policy "availability_rules_select_org_or_public"
on public.availability_rules
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.showcases s
    where s.organization_id = availability_rules.organization_id
      and s.status = 'PUBLISHED'
  )
);

create policy "availability_rules_select_member_or_super_admin"
on public.availability_rules
for select
to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "availability_rules_manage_staff"
on public.availability_rules
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

create policy "blocked_times_select_staff"
on public.blocked_times
for select
to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "blocked_times_manage_staff"
on public.blocked_times
for all
to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','PROFESSIONAL']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','PROFESSIONAL']::public.member_role[])
  or public.is_super_admin()
);

create policy "appointments_insert_public"
on public.appointments
for insert
to anon, authenticated
with check (
  status = 'REQUESTED'
  and source = 'showcase'
  and exists (
    select 1
    from public.organizations o
    where o.id = appointments.organization_id
      and o.status = 'ACTIVE'
  )
  and exists (
    select 1
    from public.showcases sh
    where sh.organization_id = appointments.organization_id
      and sh.status = 'PUBLISHED'
  )
  and (
    service_id is null
    or exists (
      select 1
      from public.services s
      where s.id = appointments.service_id
        and s.organization_id = appointments.organization_id
        and s.is_active = true
    )
  )
  and (
    professional_id is null
    or exists (
      select 1
      from public.professionals p
      where p.id = appointments.professional_id
        and p.organization_id = appointments.organization_id
        and p.is_active = true
    )
  )
);

create policy "appointments_select_staff"
on public.appointments
for select
to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

create policy "appointments_manage_staff"
on public.appointments
for update
to authenticated
using (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','ATTENDANT','PROFESSIONAL']::public.member_role[])
  or public.is_super_admin()
)
with check (
  public.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','ATTENDANT','PROFESSIONAL']::public.member_role[])
  or public.is_super_admin()
);

grant select, insert, update, delete on public.showcases to authenticated;
grant select, insert, update, delete on public.showcase_links to authenticated;
grant select, insert, update, delete on public.showcase_gallery to authenticated;
grant select, insert, update, delete on public.service_categories to authenticated;
grant select, insert, update, delete on public.services to authenticated;
grant select, insert, update, delete on public.professionals to authenticated;
grant select, insert, update, delete on public.professional_services to authenticated;
grant select, insert, update, delete on public.availability_rules to authenticated;
grant select, insert, update, delete on public.blocked_times to authenticated;
grant select, insert, update on public.appointments to authenticated;

grant select on public.showcases to anon;
grant select on public.showcase_links to anon;
grant select on public.showcase_gallery to anon;
grant select on public.service_categories to anon;
grant select on public.services to anon;
grant select on public.professionals to anon;
grant select on public.professional_services to anon;
grant select on public.availability_rules to anon;
grant insert on public.appointments to anon;
