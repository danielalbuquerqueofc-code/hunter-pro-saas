alter type public.member_status add value if not exists 'PENDING';
alter type public.member_status add value if not exists 'REMOVED';

alter table public.organization_members add column if not exists accepted_at timestamptz;
alter table public.organization_members add column if not exists invitation_expires_at timestamptz;
alter table public.organization_members add column if not exists removed_at timestamptz;

create index if not exists organization_members_org_status_idx
on public.organization_members(organization_id, status);

create index if not exists organization_members_pending_expiry_idx
on public.organization_members(status, invitation_expires_at)
where status = 'PENDING';
