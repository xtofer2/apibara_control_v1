begin;

create extension if not exists pgtap with schema extensions;
select plan(19);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) values
  (
    '47000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'audit.manager@test.local', '', now(), now(), now(), '{}',
    '{"full_name":"Gerente Auditoria"}'
  ),
  (
    '47000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-8000-000000000000', 'authenticated', 'authenticated',
    'audit.admin@test.local', '', now(), now(), now(), '{}',
    '{"full_name":"Admin Auditoria"}'
  ),
  (
    '47000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'audit.employee@test.local', '', now(), now(), now(), '{}',
    '{"full_name":"Empleado Auditoria"}'
  );

update public.profiles set role = 'MANAGER'
where id = '47000000-0000-4000-8000-000000000001';
update public.profiles set role = 'ADMIN'
where id = '47000000-0000-4000-8000-000000000002';

select ok(
  not has_table_privilege('authenticated', 'public.audit_logs', 'INSERT'),
  'authenticated users cannot insert audit events directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.audit_logs', 'UPDATE'),
  'authenticated users cannot alter audit events'
);
select ok(
  not has_table_privilege('authenticated', 'public.audit_logs', 'DELETE'),
  'authenticated users cannot delete audit events'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"47000000-0000-4000-8000-000000000003","role":"authenticated"}',
  true
);

select results_eq(
  'select count(*)::bigint from public.audit_logs',
  'values (0::bigint)',
  'employee cannot review the global audit history'
);
select throws_ok(
  $$select public.create_inventory_movement(
    '00000000-0000-4000-8000-000000000001',
    'ADJUSTMENT_POSITIVE', 'COUNT_CORRECTION', 'No autorizado',
    '[{"product_id":"20000000-0000-4000-8000-000000000001","quantity":1}]'::jsonb
  )$$,
  '42501', 'INVENTORY_ADJUSTMENT_FORBIDDEN',
  'a rejected critical action creates no audit event'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"47000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select lives_ok(
  $$select public.open_operational_shift(
    '10000000-0000-4000-8000-000000000001', 100,
    (select jsonb_agg(jsonb_build_object('product_id', id, 'quantity', 10))
      from public.products where active)
  )$$,
  'opening the origin shift records atomically'
);
select lives_ok(
  $$select public.open_operational_shift(
    '10000000-0000-4000-8000-000000000002', 80,
    (select jsonb_agg(jsonb_build_object('product_id', id, 'quantity', 5))
      from public.products where active)
  )$$,
  'opening the destination shift records atomically'
);
select lives_ok(
  $$select public.create_inventory_movement(
    (select id from public.work_shifts
      where location_id = '10000000-0000-4000-8000-000000000001' and status = 'OPEN'),
    'ADJUSTMENT_POSITIVE', 'COUNT_CORRECTION', 'Conteo físico validado',
    '[{"product_id":"20000000-0000-4000-8000-000000000001","quantity":2}]'::jsonb
  )$$,
  'manager adjustment records atomically'
);
select lives_ok(
  $$select public.send_transfer(
    (select id from public.work_shifts
      where location_id = '10000000-0000-4000-8000-000000000001' and status = 'OPEN'),
    '10000000-0000-4000-8000-000000000002',
    '[{"product_id":"20000000-0000-4000-8000-000000000001","quantity":3}]'::jsonb
  )$$,
  'transfer send records atomically'
);
select lives_ok(
  $$select public.receive_transfer(
    (select id from public.transfers where status = 'SENT'),
    (select id from public.work_shifts
      where location_id = '10000000-0000-4000-8000-000000000002' and status = 'OPEN'),
    'Llegaron dos unidades',
    '[{"product_id":"20000000-0000-4000-8000-000000000001","quantity":2}]'::jsonb
  )$$,
  'transfer discrepancy records atomically'
);
select lives_ok(
  $$select public.close_operational_shift(
    (select id from public.work_shifts
      where location_id = '10000000-0000-4000-8000-000000000002' and status = 'OPEN'),
    (select jsonb_agg(jsonb_build_object('product_id', id, 'quantity',
      case when unit_type = 'UNIT' then 2 else 1.5 end))
      from public.products where active),
    '[{"code":"CASH","amount":200},{"code":"YAPE","amount":150}]'::jsonb
  )$$,
  'shift closing records atomically'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"47000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);
select lives_ok(
  $$update public.locations
    set name = 'Av. Jesus Auditada'
    where id = '10000000-0000-4000-8000-000000000001'$$,
  'administrative correction records atomically'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"47000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select results_eq(
  'select count(*)::bigint from public.audit_logs',
  'values (7::bigint)',
  'all successful critical actions produce exactly one event'
);
select results_eq(
  $$select count(*)::bigint from public.audit_logs where action = 'SHIFT_OPENED'$$,
  'values (2::bigint)',
  'both openings are audited'
);
select results_eq(
  $$select count(*)::bigint from public.audit_logs
    where action = 'INVENTORY_ADJUSTMENT_POSITIVE'
      and new_data->>'notes' = 'Conteo físico validado'
      and jsonb_array_length(new_data->'items') = 1$$,
  'values (1::bigint)',
  'inventory adjustment preserves reason context and items'
);
select results_eq(
  $$select count(*)::bigint from public.audit_logs
    where action = 'TRANSFER_SENT'
      and old_data->>'status' = 'PENDING'
      and new_data->>'status' = 'SENT'$$,
  'values (1::bigint)',
  'transfer send preserves its status transition'
);
select results_eq(
  $$select count(*)::bigint from public.audit_logs
    where action = 'TRANSFER_RECEIVED_WITH_DIFFERENCES'
      and old_data->>'status' = 'SENT'
      and new_data->>'reception_notes' = 'Llegaron dos unidades'
      and new_data->'items'->0->>'sent_quantity' = '3.000'
      and new_data->'items'->0->>'received_quantity' = '2.000'$$,
  'values (1::bigint)',
  'transfer discrepancy preserves sent, received, and observation evidence'
);
select results_eq(
  $$select count(*)::bigint from public.audit_logs
    where action = 'SHIFT_CLOSED'
      and jsonb_array_length(new_data->'items') = 6
      and jsonb_array_length(new_data->'payments') = 2$$,
  'values (1::bigint)',
  'closing audit preserves final inventory and payment rows'
);
select results_eq(
  $$select count(*)::bigint from public.audit_logs
    where action = 'ADMIN_UPDATE'
      and entity_type = 'locations'
      and old_data->>'name' = 'Av. Jesus'
      and new_data->>'name' = 'Av. Jesus Auditada'$$,
  'values (1::bigint)',
  'administrative correction preserves before and after snapshots'
);

select * from finish();
rollback;
