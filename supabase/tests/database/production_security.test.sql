begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_tables
    where schemaname = 'public'
      and not rowsecurity
  ),
  0,
  'every public table has row level security enabled'
);

select is(
  (
    select count(*)::integer
    from information_schema.table_privileges
    where table_schema = 'public'
      and grantee = 'anon'
  ),
  0,
  'anon has no privileges on public business tables'
);

select ok(
  not has_table_privilege('authenticated', 'public.audit_logs', 'INSERT,UPDATE,DELETE,TRUNCATE'),
  'authenticated users cannot mutate the audit log directly'
);

select is(
  (
    select count(*)::integer
    from information_schema.table_privileges
    where table_schema = 'public'
      and grantee = 'authenticated'
      and privilege_type = 'DELETE'
      and table_name <> 'transfer_items'
  ),
  0,
  'authenticated users cannot delete confirmed operational records'
);

select * from finish();
rollback;
