alter table public.showcases add column if not exists logo_url text;
alter table public.showcases add column if not exists theme_key text not null default 'clean_light';
alter table public.showcases add column if not exists font_key text not null default 'sans';
alter table public.showcases add column if not exists facebook_url text;
alter table public.showcases add column if not exists tiktok_url text;
alter table public.showcases add column if not exists youtube_url text;
alter table public.showcases add column if not exists phone text;
alter table public.showcases add column if not exists address_text text;

alter table public.showcases
  drop constraint if exists showcases_theme_key_check;

alter table public.showcases
  add constraint showcases_theme_key_check
  check (theme_key in ('clean_light', 'premium_dark', 'beauty', 'wellness', 'professional_blue', 'gold'));

alter table public.showcases
  drop constraint if exists showcases_font_key_check;

alter table public.showcases
  add constraint showcases_font_key_check
  check (font_key in ('sans', 'serif', 'rounded'));

create or replace function public.can_manage_showcase_asset(p_object_name text)
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

revoke execute on function public.can_manage_showcase_asset(text) from public, anon;
grant execute on function public.can_manage_showcase_asset(text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'showcase-assets',
  'showcase-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "showcase_assets_public_select" on storage.objects;
create policy "showcase_assets_public_select"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'showcase-assets');

drop policy if exists "showcase_assets_member_insert" on storage.objects;
create policy "showcase_assets_member_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'showcase-assets'
  and public.can_manage_showcase_asset(name)
);

drop policy if exists "showcase_assets_member_update" on storage.objects;
create policy "showcase_assets_member_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'showcase-assets'
  and public.can_manage_showcase_asset(name)
)
with check (
  bucket_id = 'showcase-assets'
  and public.can_manage_showcase_asset(name)
);

drop policy if exists "showcase_assets_member_delete" on storage.objects;
create policy "showcase_assets_member_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'showcase-assets'
  and public.can_manage_showcase_asset(name)
);
