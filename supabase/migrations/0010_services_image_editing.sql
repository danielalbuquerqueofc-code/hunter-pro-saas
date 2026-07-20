-- Hunter Pro SaaS - service images.
-- Defensive migration: keeps existing services and adds an optional image URL.

alter table public.services add column if not exists image_url text;

create index if not exists services_image_url_idx on public.services(image_url)
where image_url is not null;
