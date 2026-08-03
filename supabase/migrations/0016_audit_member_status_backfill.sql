update public.organization_members
set status = 'PENDING'
where status = 'INVITED';

update public.organization_members
set accepted_at = coalesce(accepted_at, created_at)
where status = 'ACTIVE'
  and accepted_at is null;
