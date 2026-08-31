begin;

create extension if not exists pgtap with schema extensions;
select plan(19);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) values
  (
    '46000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'reports.manager@test.local', '', now(), now(), now(), '{}',
    '{"full_name":"Gerente Reportes"}'
  ),
  (
    '46000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'reports.employee@test.local', '', now(), now(), now(), '{}',
    '{"full_name":"Empleado Reportes"}'
  ),
  (
    '46000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'reports.unrelated@test.local', '', now(), now(), now(), '{}',
    '{"full_name":"Sin Participacion"}'
  ),
  (
    '46000000-0000-4000-8000-000000000004',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'reports.admin@test.local', '', now(), now(), now(), '{}',
    '{"full_name":"Administrador Reportes"}'
  );

update public.profiles
set role = 'MANAGER'
where id = '46000000-0000-4000-8000-000000000001';

update public.profiles
set role = 'ADMIN'
where id = '46000000-0000-4000-8000-000000000004';

insert into public.work_shifts (
  id, location_id, operational_date, opened_at
) values
  (
    '56000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001', '2026-08-12',
    '2026-08-12 08:00:00-05'
  ),
  (
    '56000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002', '2026-08-12',
    '2026-08-12 08:05:00-05'
  );

insert into public.openings (id, work_shift_id, created_by, cash_opening) values
  ('66000000-0000-4000-8000-000000000001', '56000000-0000-4000-8000-000000000001', '46000000-0000-4000-8000-000000000001', 100),
  ('66000000-0000-4000-8000-000000000002', '56000000-0000-4000-8000-000000000002', '46000000-0000-4000-8000-000000000001', 100);

insert into public.opening_items (opening_id, product_id, quantity)
select '66000000-0000-4000-8000-000000000001', id, 20 from public.products where active;
insert into public.opening_items (opening_id, product_id, quantity)
select '66000000-0000-4000-8000-000000000002', id, 10 from public.products where active;

insert into public.inventory_movements (
  id, work_shift_id, movement_type, reason, notes, created_by
) values
  ('76000000-0000-4000-8000-000000000001', '56000000-0000-4000-8000-000000000002', 'ENTRY', null, null, '46000000-0000-4000-8000-000000000001'),
  ('76000000-0000-4000-8000-000000000002', '56000000-0000-4000-8000-000000000002', 'WASTE', 'DAMAGED', null, '46000000-0000-4000-8000-000000000001'),
  ('76000000-0000-4000-8000-000000000003', '56000000-0000-4000-8000-000000000002', 'ADJUSTMENT_POSITIVE', 'CORRECTION', 'Conteo verificado', '46000000-0000-4000-8000-000000000001'),
  ('76000000-0000-4000-8000-000000000004', '56000000-0000-4000-8000-000000000002', 'ADJUSTMENT_NEGATIVE', 'CORRECTION', 'Conteo verificado', '46000000-0000-4000-8000-000000000001');

insert into public.inventory_movement_items (inventory_movement_id, product_id, quantity) values
  ('76000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 5),
  ('76000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 1),
  ('76000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 2),
  ('76000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', 1);

insert into public.transfers (
  id, origin_location_id, destination_location_id, origin_work_shift_id,
  created_by
) values (
  '86000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '56000000-0000-4000-8000-000000000001',
  '46000000-0000-4000-8000-000000000001'
), (
  '86000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000001',
  '56000000-0000-4000-8000-000000000002',
  '46000000-0000-4000-8000-000000000001'
);

insert into public.transfer_items (transfer_id, product_id, sent_quantity, received_quantity) values
  ('86000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 3, null),
  ('86000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 4, null);

update public.transfers
set status = 'SENT',
    sent_by = '46000000-0000-4000-8000-000000000001',
    sent_at = case
      when id = '86000000-0000-4000-8000-000000000001' then '2026-08-12 10:00:00-05'::timestamptz
      else '2026-08-12 11:00:00-05'::timestamptz
    end
where id in (
  '86000000-0000-4000-8000-000000000001',
  '86000000-0000-4000-8000-000000000002'
);

update public.transfer_items
set received_quantity = 3
where transfer_id = '86000000-0000-4000-8000-000000000001';

update public.transfers
set status = 'RECEIVED',
    destination_work_shift_id = '56000000-0000-4000-8000-000000000002',
    received_by = '46000000-0000-4000-8000-000000000001',
    received_at = '2026-08-12 10:30:00-05'
where id = '86000000-0000-4000-8000-000000000001';

insert into public.closings (id, work_shift_id, created_by) values
  ('96000000-0000-4000-8000-000000000001', '56000000-0000-4000-8000-000000000001', '46000000-0000-4000-8000-000000000001'),
  ('96000000-0000-4000-8000-000000000002', '56000000-0000-4000-8000-000000000002', '46000000-0000-4000-8000-000000000001');

insert into public.closing_items (closing_id, product_id, quantity)
select '96000000-0000-4000-8000-000000000001', id, 20 from public.products where active;
insert into public.closing_items (closing_id, product_id, quantity)
select '96000000-0000-4000-8000-000000000002', id,
  case when code = 'EMP_CLASSIC' then 6 else 10 end
from public.products where active;

insert into public.closing_payments (closing_id, payment_method_id, amount)
select '96000000-0000-4000-8000-000000000002', id,
  case when code = 'CASH' then 200 else 150 end
from public.payment_methods where code in ('CASH', 'YAPE');

update public.work_shifts
set status = 'CLOSED',
    closed_at = case
      when id = '56000000-0000-4000-8000-000000000001' then '2026-08-12 18:00:00-05'::timestamptz
      else '2026-08-12 18:05:00-05'::timestamptz
    end
where id in (
  '56000000-0000-4000-8000-000000000001',
  '56000000-0000-4000-8000-000000000002'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"46000000-0000-4000-8000-000000000002","role":"authenticated"}', true);

select throws_ok(
  $$select * from public.management_reconciliation_report('2026-08-12')$$,
  '42501', 'REPORTS_FORBIDDEN', 'employees cannot execute management reports'
);

select set_config('request.jwt.claims', '{"sub":"46000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

select lives_ok(
  $$select * from public.management_reconciliation_report('2026-08-12')$$,
  'manager can execute management report'
);
select results_eq(
  $$select count(*)::bigint from public.management_reconciliation_report(
    '2026-08-12', '10000000-0000-4000-8000-000000000002'
  )$$,
  'values (6::bigint)', 'report returns one row per product for the selected closed shift'
);
select results_eq(
  $$select opening_quantity from public.management_reconciliation_report(
    '2026-08-12', '10000000-0000-4000-8000-000000000002'
  ) where product_code = 'EMP_CLASSIC'$$,
  'values (10::numeric)', 'report includes opening quantity'
);
select results_eq(
  $$select entry_quantity, received_transfer_quantity, positive_adjustment_quantity
    from public.management_reconciliation_report(
      '2026-08-12', '10000000-0000-4000-8000-000000000002'
    ) where product_code = 'EMP_CLASSIC'$$,
  'values (5::numeric, 3::numeric, 2::numeric)', 'report includes all inventory additions'
);
select results_eq(
  $$select sent_transfer_quantity, waste_quantity, negative_adjustment_quantity, closing_quantity
    from public.management_reconciliation_report(
      '2026-08-12', '10000000-0000-4000-8000-000000000002'
    ) where product_code = 'EMP_CLASSIC'$$,
  'values (4::numeric, 1::numeric, 1::numeric, 6::numeric)', 'report includes all inventory deductions and closing'
);
select results_eq(
  $$select calculated_sales from public.management_reconciliation_report(
    '2026-08-12', '10000000-0000-4000-8000-000000000002'
  ) where product_code = 'EMP_CLASSIC'$$,
  'values (8::numeric)', 'calculated sales match the documented formula'
);
select results_eq(
  $$select sum(calculated_sales)::numeric from public.management_reconciliation_report(
    '2026-08-12', '10000000-0000-4000-8000-000000000002'
  )$$,
  'values (8::numeric)', 'products without activity reconcile to zero sales'
);
select results_eq(
  $$select distinct cash_amount, yape_amount, closing_total
    from public.management_reconciliation_report(
      '2026-08-12', '10000000-0000-4000-8000-000000000002'
    )$$,
  'values (200::numeric, 150::numeric, 350::numeric)', 'payment totals are derived from closing payment rows'
);
select results_eq(
  $$select count(*)::bigint from public.management_reconciliation_report(
    '2026-08-11', '10000000-0000-4000-8000-000000000002'
  )$$,
  'values (0::bigint)', 'date filter excludes other operational dates'
);
select results_eq(
  $$select count(*)::bigint from public.management_reconciliation_report(
    '2026-08-12', '10000000-0000-4000-8000-000000000002',
    '46000000-0000-4000-8000-000000000001'
  )$$,
  'values (6::bigint)', 'employee activity filter includes participating user'
);
select results_eq(
  $$select count(*)::bigint from public.management_reconciliation_report(
    '2026-08-12', '10000000-0000-4000-8000-000000000002',
    '46000000-0000-4000-8000-000000000003'
  )$$,
  'values (0::bigint)', 'employee activity filter excludes unrelated user'
);
select ok(
  to_regclass('public.sales') is null,
  'calculated sales are not persisted in a sales table'
);

select throws_ok(
  $$select * from public.management_monthly_daily_income('2026-08-01')$$,
  '42501', 'REPORTS_ADMIN_ONLY',
  'managers cannot execute the monthly business report'
);

select set_config('request.jwt.claims', '{"sub":"46000000-0000-4000-8000-000000000004","role":"authenticated"}', true);

select results_eq(
  $$select count(*)::bigint from public.management_monthly_daily_income('2026-08-01')$$,
  'values (31::bigint)',
  'the monthly report returns every calendar day in a completed month'
);
select results_eq(
  $$select total_income from public.management_monthly_daily_income('2026-08-01') where operational_date = '2026-08-12'$$,
  'values (350::numeric)',
  'daily income sums closing payments once per shift'
);
select results_eq(
  $$select sum(total_income)::numeric from public.management_monthly_location_income('2026-08-01')$$,
  'values (350::numeric)',
  'location income does not duplicate closing payments per product'
);
select results_eq(
  $$select total_income from public.management_monthly_location_income(
    '2026-08-01', '10000000-0000-4000-8000-000000000002'
  )$$,
  'values (350::numeric)',
  'the monthly location filter isolates one location'
);
select results_eq(
  $$select calculated_sales from public.management_monthly_product_sales(
    '2026-08-01', '10000000-0000-4000-8000-000000000002'
  ) where product_code = 'EMP_CLASSIC'$$,
  'values (8::numeric)',
  'monthly product sales reuse the documented reconciliation formula'
);

select * from finish();
rollback;
