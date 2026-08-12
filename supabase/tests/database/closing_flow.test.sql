begin;

create extension if not exists pgtap with schema extensions;
select plan(18);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) values (
  '45000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'closing.employee@test.local', '', now(), now(), now(), '{}',
  '{"full_name":"Empleado Cierre"}'
);

insert into public.work_shifts (id, location_id)
values ('55000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001');

insert into public.openings (work_shift_id, created_by, cash_opening)
values ('55000000-0000-4000-8000-000000000001', '45000000-0000-4000-8000-000000000001', 100);

select ok(not has_table_privilege('authenticated', 'public.closings', 'INSERT'), 'direct closing insert is revoked');
select ok(not has_table_privilege('authenticated', 'public.closing_items', 'INSERT'), 'direct closing item insert is revoked');
select ok(not has_table_privilege('authenticated', 'public.closing_payments', 'INSERT'), 'direct closing payment insert is revoked');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"45000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

select throws_ok(
  $$select public.close_operational_shift(
    '55000000-0000-4000-8000-000000000001',
    '[{"product_id":"20000000-0000-4000-8000-000000000001","quantity":2}]'::jsonb,
    '[{"code":"CASH","amount":200},{"code":"YAPE","amount":150}]'::jsonb
  )$$,
  'P0001', 'CLOSING_PRODUCT_SET_MISMATCH', 'incomplete product count is rejected'
);
select results_eq('select count(*)::bigint from public.closings', 'values (0::bigint)', 'rejected count leaves no closing');

select throws_ok(
  $$select public.close_operational_shift(
    '55000000-0000-4000-8000-000000000001',
    (select jsonb_agg(jsonb_build_object('product_id', id, 'quantity', 2)) from public.products where active),
    '[{"code":"CASH","amount":200}]'::jsonb
  )$$,
  'P0001', 'CLOSING_INVALID_PAYMENTS', 'both CASH and YAPE are required'
);
select throws_ok(
  $$select public.close_operational_shift(
    '55000000-0000-4000-8000-000000000001',
    (select jsonb_agg(jsonb_build_object('product_id', id, 'quantity', case when code = 'EMP_CLASSIC' then 1.5 else 2 end)) from public.products where active),
    '[{"code":"CASH","amount":200},{"code":"YAPE","amount":150}]'::jsonb
  )$$,
  'P0001', 'CLOSING_UNIT_QUANTITY_REQUIRED', 'UNIT closing quantity must be whole'
);

select lives_ok(
  $$select public.close_operational_shift(
    '55000000-0000-4000-8000-000000000001',
    (select jsonb_agg(jsonb_build_object('product_id', id, 'quantity', case when unit_type = 'UNIT' then 2 else 1.25 end)) from public.products where active),
    '[{"code":"CASH","amount":200.50},{"code":"YAPE","amount":150.25}]'::jsonb
  )$$,
  'employee closes shift atomically'
);
select results_eq(
  $$select count(*)::bigint from public.closings
    where created_by = '45000000-0000-4000-8000-000000000001'$$,
  'values (1::bigint)', 'closing records authenticated creator'
);
select results_eq('select count(*)::bigint from public.closing_items', 'values (6::bigint)', 'closing stores every active product');
select results_eq('select count(*)::bigint from public.closing_payments', 'values (2::bigint)', 'closing stores two payment records');
select results_eq(
  'select sum(amount)::numeric from public.closing_payments',
  'values (350.75::numeric)', 'closing total is calculated from payment rows'
);
select results_eq(
  $$select count(*)::bigint from public.work_shifts
    where id = '55000000-0000-4000-8000-000000000001'
      and status = 'CLOSED' and closed_at is not null$$,
  'values (1::bigint)', 'shift becomes CLOSED with server timestamp'
);

select throws_ok(
  $$select public.close_operational_shift(
    '55000000-0000-4000-8000-000000000001',
    (select jsonb_agg(jsonb_build_object('product_id', id, 'quantity', 0)) from public.products where active),
    '[{"code":"CASH","amount":0},{"code":"YAPE","amount":0}]'::jsonb
  )$$,
  'P0001', 'CLOSING_SHIFT_NOT_OPEN', 'shift cannot close twice'
);

select throws_ok(
  $$select public.create_inventory_movement(
    '55000000-0000-4000-8000-000000000001', 'ENTRY', null, null,
    '[{"product_id":"20000000-0000-4000-8000-000000000001","quantity":1}]'::jsonb
  )$$,
  'P0001', 'INVENTORY_SHIFT_NOT_OPEN', 'closed shift rejects inventory movements'
);
select throws_ok(
  $$select public.send_transfer(
    '55000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '[{"product_id":"20000000-0000-4000-8000-000000000001","quantity":1}]'::jsonb
  )$$,
  'P0001', 'TRANSFER_ORIGIN_SHIFT_NOT_OPEN', 'closed shift rejects new transfers'
);
select results_eq(
  'select count(*)::bigint from public.closings',
  'values (1::bigint)', 'failed post-close operations do not duplicate closing'
);
select results_eq(
  $$select count(*)::bigint from public.closing_payments cp
    join public.payment_methods pm on pm.id = cp.payment_method_id
    where pm.code in ('CASH', 'YAPE')$$,
  'values (2::bigint)', 'payments reference catalog methods rather than columns'
);

select * from finish();
rollback;
