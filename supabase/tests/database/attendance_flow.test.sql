begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

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
    '41000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'attendance.employee@test.local',
    '',
    now(),
    now(),
    now(),
    '{}',
    '{"full_name":"Empleado Asistencia"}'
  ),
  (
    '41000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'attendance.manager@test.local',
    '',
    now(),
    now(),
    now(),
    '{}',
    '{"full_name":"Gerente Asistencia"}'
  );

update public.profiles
set role = 'MANAGER'
where id = '41000000-0000-4000-8000-000000000002';

select ok(
  not has_table_privilege('authenticated', 'public.attendance', 'INSERT'),
  'authenticated users cannot insert attendance directly'
);

select ok(
  not has_table_privilege('authenticated', 'public.attendance', 'UPDATE'),
  'authenticated users cannot update attendance directly'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"41000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select lives_ok(
  $$select public.attendance_check_in('10000000-0000-4000-8000-000000000001')$$,
  'an active employee can check in'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.attendance
    where user_id = '41000000-0000-4000-8000-000000000001'
      and check_out_at is null
  $$,
  'values (1::bigint)',
  'check-in creates one open attendance record'
);

select throws_ok(
  $$select public.attendance_check_in('10000000-0000-4000-8000-000000000002')$$,
  'P0001',
  'ATTENDANCE_ALREADY_OPEN',
  'an employee cannot have two open attendance records'
);

select throws_ok(
  $$
    select *
    from public.attendance_manager_report(
      (now() at time zone 'America/Lima')::date,
      null,
      null
    )
  $$,
  '42501',
  'ATTENDANCE_REPORT_FORBIDDEN',
  'an employee cannot call the manager report directly'
);

select lives_ok(
  $$select public.attendance_check_out()$$,
  'an employee can check out their open attendance'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.attendance
    where user_id = '41000000-0000-4000-8000-000000000001'
      and check_out_at is not null
  $$,
  'values (1::bigint)',
  'check-out closes the attendance record'
);

select throws_ok(
  $$select public.attendance_check_out()$$,
  'P0001',
  'ATTENDANCE_NOT_OPEN',
  'an employee cannot check out twice'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"41000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

select results_eq(
  $$
    select count(*)::bigint
    from public.attendance_manager_report(
      (now() at time zone 'America/Lima')::date,
      null,
      null
    )
    where user_id = '41000000-0000-4000-8000-000000000001'
  $$,
  'values (1::bigint)',
  'a manager can read the daily attendance report'
);

select * from finish();
rollback;
