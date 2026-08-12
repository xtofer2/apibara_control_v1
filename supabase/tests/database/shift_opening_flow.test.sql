begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

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
    '42000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'shift.employee@test.local',
    '',
    now(),
    now(),
    now(),
    '{}',
    '{"full_name":"Empleado Turnos"}'
  ),
  (
    '42000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'shift.inactive@test.local',
    '',
    now(),
    now(),
    now(),
    '{}',
    '{"full_name":"Empleado Inactivo Turnos"}'
  );

update public.profiles
set active = false
where id = '42000000-0000-4000-8000-000000000002';

select ok(
  not has_table_privilege('authenticated', 'public.work_shifts', 'INSERT'),
  'authenticated users cannot create shifts directly'
);

select ok(
  not has_table_privilege('authenticated', 'public.openings', 'INSERT'),
  'authenticated users cannot create openings directly'
);

select ok(
  not has_table_privilege('authenticated', 'public.opening_items', 'INSERT'),
  'authenticated users cannot create opening items directly'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"42000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select lives_ok(
  $$
    select public.open_operational_shift(
      '10000000-0000-4000-8000-000000000001',
      150.25,
      (
        select jsonb_agg(jsonb_build_object(
          'product_id', products.id,
          'quantity', case when products.unit_type = 'UNIT' then 12 else 4.500 end
        ))
        from public.products
        where active
      )
    )
  $$,
  'an employee atomically opens a shift with its complete opening'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.work_shifts
    where location_id = '10000000-0000-4000-8000-000000000001'
      and status = 'OPEN'
  $$,
  'values (1::bigint)',
  'the operation creates one open shift'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.openings
    join public.work_shifts on work_shifts.id = openings.work_shift_id
    where work_shifts.location_id = '10000000-0000-4000-8000-000000000001'
      and openings.cash_opening = 150.25
  $$,
  'values (1::bigint)',
  'the operation stores the initial physical cash'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.opening_items
    join public.openings on openings.id = opening_items.opening_id
    join public.work_shifts on work_shifts.id = openings.work_shift_id
    where work_shifts.location_id = '10000000-0000-4000-8000-000000000001'
  $$,
  'values (6::bigint)',
  'the opening contains every active product exactly once'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.openings
    where created_by = '42000000-0000-4000-8000-000000000001'
  $$,
  'values (1::bigint)',
  'the server records the authenticated employee as opening creator'
);

select throws_ok(
  $$
    insert into public.work_shifts (location_id)
    values ('10000000-0000-4000-8000-000000000002')
  $$,
  '42501',
  'permission denied for table work_shifts',
  'an employee cannot bypass the transactional opening function'
);

select throws_ok(
  $$
    select public.open_operational_shift(
      '10000000-0000-4000-8000-000000000001',
      10,
      (
        select jsonb_agg(jsonb_build_object('product_id', id, 'quantity', 0))
        from public.products
        where active
      )
    )
  $$,
  'P0001',
  'SHIFT_ALREADY_OPEN',
  'a location cannot have two open shifts'
);

select throws_ok(
  $$
    select public.open_operational_shift(
      '10000000-0000-4000-8000-000000000002',
      10,
      jsonb_build_array(jsonb_build_object(
        'product_id', '20000000-0000-4000-8000-000000000001',
        'quantity', 1
      ))
    )
  $$,
  'P0001',
  'SHIFT_PRODUCT_SET_MISMATCH',
  'an incomplete product count is rejected'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.work_shifts
    where location_id = '10000000-0000-4000-8000-000000000002'
  $$,
  'values (0::bigint)',
  'a rejected opening leaves no partial shift'
);

select throws_ok(
  $$
    select public.open_operational_shift(
      '10000000-0000-4000-8000-000000000002',
      10,
      (
        select jsonb_agg(jsonb_build_object(
          'product_id', products.id,
          'quantity', case when products.code = 'EMP_CLASSIC' then 1.5 else 0 end
        ))
        from public.products
        where active
      )
    )
  $$,
  'P0001',
  'SHIFT_UNIT_QUANTITY_REQUIRED',
  'UNIT products reject fractional quantities'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"42000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

select throws_ok(
  $$
    select public.open_operational_shift(
      '10000000-0000-4000-8000-000000000002',
      0,
      (
        select jsonb_agg(jsonb_build_object('product_id', id, 'quantity', 0))
        from public.products
        where active
      )
    )
  $$,
  '42501',
  'SHIFT_FORBIDDEN',
  'an inactive employee cannot open a shift'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"42000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select lives_ok(
  $$
    select public.open_operational_shift(
      '10000000-0000-4000-8000-000000000002',
      0,
      (
        select jsonb_agg(jsonb_build_object('product_id', id, 'quantity', 0))
        from public.products
        where active
      )
    )
  $$,
  'a valid opening still succeeds after rejected transactions'
);

select * from finish();
rollback;
