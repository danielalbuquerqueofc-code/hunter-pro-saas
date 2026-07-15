select
  'profiles table' as item,
  to_regclass('public.profiles') is not null as ok
union all
select
  'organizations table',
  to_regclass('public.organizations') is not null
union all
select
  'organization_members table',
  to_regclass('public.organization_members') is not null
union all
select
  'plans table',
  to_regclass('public.plans') is not null
union all
select
  'create_organization_for_current_user function',
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'create_organization_for_current_user'
  );
