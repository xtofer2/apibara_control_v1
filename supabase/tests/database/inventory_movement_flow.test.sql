begin;

create extension if not exists pgtap with schema extensions;
select plan(18);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
)
values
  (
    '43000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'inventory.employee@test.local', '', now(), now(), now(), '{}',
    '{"full_name":"Empleado Inventario"}'
  ),
  (
    '43000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-8000-000000000000', 'authenticated', 'authenticated',
    'inventory.manager@test.local', '', now(), now(), now(), '{}',
    '{"full_name":"Gerente Inventario"}'
  );

update public.profiles set role = 'MANAGER'
where id = '43000000-0000-4000-8000-000000000002';

insert into public.work_shifts (id, location_id)
values (
  '53000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002'
);

insert into public.work_shifts (
  id,
  location_id,
  operational_date,
  status,
  opened_at,
  closed_at
) values (
  '53000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000001',
  ((now() - interval '1 hour') at time zone 'America/Lima')::date,
  'CLOSED',
  now() - interval '1 hour',
  now()
);

insert into public.openings (work_shift_id, created_by, cash_opening)
values (
  '53000000-0000-4000-8000-000000000001',
  '43000000-0000-4000-8000-000000000001',
  50
);

select ok(
  not has_table_privilege('authenticated', 'public.inventory_movements', 'INSERT'),
  'authenticated users cannot insert movement headers directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.inventory_movement_items', 'INSERT'),
  'authenticated users cannot insert movement items directly'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"43000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

select lives_ok(
  $$select public.create_inventory_movement(
    '53000000-0000-4000-8000-000000000001', 'ENTRY', null, 'Compra del día',
    '[{"product_id":"20000000-0000-4000-8000-000000000001","quantity":10},{"product_id":"20000000-0000-4000-8000-000000000004","quantity":2.5}]'::jsonb
  )$$,
  'employee creates a multi-product entry'
);
select results_eq(
  'select count(*)::bigint from public.inventory_movements where movement_type = ''ENTRY''',
  'values (1::bigint)',
  'entry header is stored'
);
select results_eq(
  'select count(*)::bigint from public.inventory_movement_items',
  'values (2::bigint)',
  'all entry items are stored atomically'
);

select lives_ok(
  $$select public.create_inventory_movement(
    '53000000-0000-4000-8000-000000000001', 'WASTE', 'DAMAGED', null,
    '[{"product_id":"20000000-0000-4000-8000-000000000002","quantity":1}]'::jsonb
  )$$,
  'employee creates waste with a valid reason'
);
select throws_ok(
  $$select public.create_inventory_movement(
    '53000000-0000-4000-8000-000000000001', 'WASTE', null, null,
    '[{"product_id":"20000000-0000-4000-8000-000000000002","quantity":1}]'::jsonb
  )$$,
  'P0001', 'INVENTORY_WASTE_REASON_REQUIRED', 'waste requires a reason'
);
select throws_ok(
  $$select public.create_inventory_movement(
    '53000000-0000-4000-8000-000000000001', 'WASTE', 'OTHER', null,
    '[{"product_id":"20000000-0000-4000-8000-000000000002","quantity":1}]'::jsonb
  )$$,
  'P0001', 'INVENTORY_OTHER_NOTES_REQUIRED', 'OTHER waste requires notes'
);
select throws_ok(
  $$select public.create_inventory_movement(
    '53000000-0000-4000-8000-000000000001', 'ADJUSTMENT_POSITIVE', 'COUNT', 'Correction',
    '[{"product_id":"20000000-0000-4000-8000-000000000001","quantity":1}]'::jsonb
  )$$,
  '42501', 'INVENTORY_ADJUSTMENT_FORBIDDEN', 'employee cannot create adjustments'
);
select throws_ok(
  $$select public.create_inventory_movement(
    '53000000-0000-4000-8000-000000000001', 'ENTRY', null, null,
    '[{"product_id":"20000000-0000-4000-8000-000000000001","quantity":1.5}]'::jsonb
  )$$,
  'P0001', 'INVENTORY_UNIT_QUANTITY_REQUIRED', 'UNIT product rejects decimal quantity'
);
select throws_ok(
  $$select public.create_inventory_movement(
    '53000000-0000-4000-8000-000000000001', 'ENTRY', null, null,
    '[{"product_id":"20000000-0000-4000-8000-000000000001","quantity":0}]'::jsonb
  )$$,
  'P0001', 'INVENTORY_INVALID_QUANTITY', 'zero quantity is rejected'
);
select results_eq(
  'select count(*)::bigint from public.inventory_movements',
  'values (2::bigint)',
  'rejected operations leave no partial headers'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"43000000-0000-4000-8000-000000000002","role":"authenticated"}', true);

select lives_ok(
  $$select public.create_inventory_movement(
    '53000000-0000-4000-8000-000000000001', 'ADJUSTMENT_NEGATIVE', 'COUNT_CORRECTION', 'Conteo físico menor',
    '[{"product_id":"20000000-0000-4000-8000-000000000004","quantity":0.25}]'::jsonb
  )$$,
  'manager creates a documented adjustment'
);
select results_eq(
  $$select count(*)::bigint from public.inventory_movements
    where movement_type = 'ADJUSTMENT_NEGATIVE'
      and reason = 'COUNT_CORRECTION'
      and notes = 'Conteo físico menor'$$,
  'values (1::bigint)',
  'adjustment preserves reason and notes'
);
select throws_ok(
  $$select public.create_inventory_movement(
    '53000000-0000-4000-8000-000000000001', 'ADJUSTMENT_POSITIVE', 'COUNT_CORRECTION', null,
    '[{"product_id":"20000000-0000-4000-8000-000000000001","quantity":1}]'::jsonb
  )$$,
  'P0001', 'INVENTORY_ADJUSTMENT_DETAILS_REQUIRED', 'adjustment requires notes'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"43000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select throws_ok(
  $$select public.create_inventory_movement(
    '53000000-0000-4000-8000-000000000002', 'ENTRY', null, null,
    '[{"product_id":"20000000-0000-4000-8000-000000000001","quantity":1}]'::jsonb
  )$$,
  'P0001', 'INVENTORY_SHIFT_NOT_OPEN', 'closed shift rejects new movements'
);
select results_eq(
  'select count(*)::bigint from public.inventory_movements',
  'values (2::bigint)',
  'employee sees only their own two movements'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"43000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select results_eq(
  'select count(*)::bigint from public.inventory_movements',
  'values (3::bigint)',
  'manager sees complete movement history'
);

select * from finish();
rollback;
