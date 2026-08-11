begin;

create extension if not exists pgtap with schema extensions;

select plan(21);

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'employee@test.local',
    '',
    now(),
    now(),
    now(),
    '{}',
    '{"full_name":"Empleado Test"}'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'manager@test.local',
    '',
    now(),
    now(),
    now(),
    '{}',
    '{"full_name":"Gerente Test"}'
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@test.local',
    '',
    now(),
    now(),
    now(),
    '{}',
    '{"full_name":"Admin Test"}'
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'inactive@test.local',
    '',
    now(),
    now(),
    now(),
    '{}',
    '{"full_name":"Inactivo Test"}'
  );

update public.profiles
set role = 'MANAGER'
where id = '40000000-0000-4000-8000-000000000002';

update public.profiles
set role = 'ADMIN'
where id = '40000000-0000-4000-8000-000000000003';

update public.profiles
set active = false
where id = '40000000-0000-4000-8000-000000000004';

insert into public.work_shifts (
  id,
  location_id,
  operational_date,
  opened_at
)
values (
  '50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  (now() at time zone 'America/Lima')::date,
  now()
);

insert into public.audit_logs (
  id,
  user_id,
  action,
  entity_type,
  entity_id
)
values (
  '60000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000002',
  'TEST_ACTION',
  'TEST_ENTITY',
  '50000000-0000-4000-8000-000000000001'
);

select ok(
  not has_table_privilege('anon', 'public.locations', 'SELECT'),
  'anon has no access to business tables'
);

select ok(
  not has_table_privilege('authenticated', 'public.audit_logs', 'INSERT'),
  'authenticated users cannot write audit logs directly'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select results_eq(
  'select count(*)::bigint from public.locations',
  'values (2::bigint)',
  'an active employee reads active locations'
);

select results_eq(
  'select count(*)::bigint from public.profiles',
  'values (1::bigint)',
  'an employee reads only their own profile'
);

select results_eq(
  $$
    with changed as (
      update public.profiles
      set role = 'ADMIN'
      where id = '40000000-0000-4000-8000-000000000001'
      returning 1
    )
    select count(*)::bigint from changed
  $$,
  'values (0::bigint)',
  'an employee cannot elevate their role'
);

select results_eq(
  $$
    with changed as (
      update public.locations
      set name = 'Cambio no autorizado'
      where id = '10000000-0000-4000-8000-000000000001'
      returning 1
    )
    select count(*)::bigint from changed
  $$,
  'values (0::bigint)',
  'an employee cannot modify locations'
);

select lives_ok(
  $$
    insert into public.attendance (user_id, location_id)
    values (
      '40000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001'
    )
  $$,
  'an employee can register their own attendance'
);

select throws_ok(
  $$
    insert into public.attendance (user_id, location_id)
    values (
      '40000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000002'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "attendance"',
  'an employee cannot register attendance for another user'
);

select lives_ok(
  $$
    insert into public.inventory_movements (
      work_shift_id,
      movement_type,
      created_by
    )
    values (
      '50000000-0000-4000-8000-000000000001',
      'ENTRY',
      '40000000-0000-4000-8000-000000000001'
    )
  $$,
  'an employee can create an inventory entry'
);

select throws_ok(
  $$
    insert into public.inventory_movements (
      work_shift_id,
      movement_type,
      reason,
      notes,
      created_by
    )
    values (
      '50000000-0000-4000-8000-000000000001',
      'ADJUSTMENT_POSITIVE',
      'COUNT_CORRECTION',
      'Intento no autorizado',
      '40000000-0000-4000-8000-000000000001'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "inventory_movements"',
  'an employee cannot create inventory adjustments'
);

select results_eq(
  'select count(*)::bigint from public.audit_logs',
  'values (0::bigint)',
  'an employee cannot read audit logs'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

select results_eq(
  $$
    select count(*)::bigint
    from public.profiles
    where id in (
      '40000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000002',
      '40000000-0000-4000-8000-000000000003',
      '40000000-0000-4000-8000-000000000004'
    )
  $$,
  'values (4::bigint)',
  'a manager can read profiles for operational reports'
);

select results_eq(
  'select count(*)::bigint from public.audit_logs',
  'values (1::bigint)',
  'a manager can read audit logs'
);

select lives_ok(
  $$
    insert into public.inventory_movements (
      work_shift_id,
      movement_type,
      reason,
      notes,
      created_by
    )
    values (
      '50000000-0000-4000-8000-000000000001',
      'ADJUSTMENT_NEGATIVE',
      'COUNT_CORRECTION',
      'Ajuste autorizado',
      '40000000-0000-4000-8000-000000000002'
    )
  $$,
  'a manager can create inventory adjustments'
);

select results_eq(
  $$
    with changed as (
      update public.locations
      set name = 'Cambio de gerente'
      where id = '10000000-0000-4000-8000-000000000001'
      returning 1
    )
    select count(*)::bigint from changed
  $$,
  'values (0::bigint)',
  'a manager cannot modify locations'
);

select results_eq(
  $$
    with changed as (
      update public.profiles
      set role = 'ADMIN'
      where id = '40000000-0000-4000-8000-000000000001'
      returning 1
    )
    select count(*)::bigint from changed
  $$,
  'values (0::bigint)',
  'a manager cannot manage roles'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-4000-8000-000000000003","role":"authenticated"}',
  true
);

select results_eq(
  $$
    with changed as (
      update public.locations
      set name = 'Av. Jesús Administrada'
      where id = '10000000-0000-4000-8000-000000000001'
      returning 1
    )
    select count(*)::bigint from changed
  $$,
  'values (1::bigint)',
  'an admin can modify locations'
);

select results_eq(
  $$
    with changed as (
      update public.profiles
      set role = 'MANAGER'
      where id = '40000000-0000-4000-8000-000000000001'
      returning 1
    )
    select count(*)::bigint from changed
  $$,
  'values (1::bigint)',
  'an admin can manage roles'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-4000-8000-000000000004","role":"authenticated"}',
  true
);

select results_eq(
  'select count(*)::bigint from public.locations',
  'values (0::bigint)',
  'an inactive user cannot read catalogs'
);

select results_eq(
  'select count(*)::bigint from public.profiles',
  'values (1::bigint)',
  'an inactive user can still read only their own profile'
);

select throws_ok(
  $$
    insert into public.attendance (user_id, location_id)
    values (
      '40000000-0000-4000-8000-000000000004',
      '10000000-0000-4000-8000-000000000001'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "attendance"',
  'an inactive user cannot create operational records'
);

select * from finish();
rollback;
