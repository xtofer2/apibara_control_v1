begin;

do $$
begin
  if exists (
    select 1
    from public.attendance
    group by user_id, work_date
    having count(*) > 1
  ) then
    raise exception using
      errcode = '23505',
      message = 'ATTENDANCE_DUPLICATE_USER_DATE_REQUIRES_REVIEW';
  end if;
end;
$$;

alter table public.attendance
  drop constraint attendance_user_location_date_unique;

alter table public.attendance
  add constraint attendance_user_date_unique unique (user_id, work_date);

create or replace function public.attendance_check_in(selected_location_id uuid)
returns public.attendance
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  existing_location_name text;
  new_attendance public.attendance;
begin
  current_user_id = (select auth.uid());

  if current_user_id is null
     or not (select private.is_active_user()) then
    raise exception using errcode = '42501', message = 'ATTENDANCE_FORBIDDEN';
  end if;

  if not exists (
    select 1
    from public.locations
    where id = selected_location_id
      and active
  ) then
    raise exception using errcode = 'P0001', message = 'ATTENDANCE_LOCATION_UNAVAILABLE';
  end if;

  if exists (
    select 1
    from public.attendance
    where user_id = current_user_id
      and check_out_at is null
  ) then
    raise exception using errcode = 'P0001', message = 'ATTENDANCE_ALREADY_OPEN';
  end if;

  select locations.name
  into existing_location_name
  from public.attendance
  join public.locations on locations.id = attendance.location_id
  where attendance.user_id = current_user_id
    and attendance.work_date = ((now() at time zone 'America/Lima')::date);

  if found then
    raise exception using
      errcode = 'P0001',
      message = 'ATTENDANCE_ALREADY_RECORDED',
      detail = existing_location_name;
  end if;

  insert into public.attendance (user_id, location_id)
  values (current_user_id, selected_location_id)
  returning * into new_attendance;

  return new_attendance;
exception
  when unique_violation then
    if exists (
      select 1
      from public.attendance
      where user_id = current_user_id
        and check_out_at is null
    ) then
      raise exception using errcode = 'P0001', message = 'ATTENDANCE_ALREADY_OPEN';
    end if;

    select locations.name
    into existing_location_name
    from public.attendance
    join public.locations on locations.id = attendance.location_id
    where attendance.user_id = current_user_id
      and attendance.work_date = ((now() at time zone 'America/Lima')::date);

    raise exception using
      errcode = 'P0001',
      message = 'ATTENDANCE_ALREADY_RECORDED',
      detail = existing_location_name;
end;
$$;

create function public.attendance_period_report(
  selected_user_id uuid,
  selected_start_date date,
  selected_end_date date
)
returns table (
  work_date date,
  attendance_id uuid,
  location_id uuid,
  location_name text,
  location_code text,
  check_in_at timestamptz,
  check_out_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select private.has_minimum_role('MANAGER')) then
    raise exception using errcode = '42501', message = 'ATTENDANCE_REPORT_FORBIDDEN';
  end if;

  if selected_user_id is null
     or selected_start_date is null
     or selected_end_date is null
     or selected_end_date < selected_start_date
     or (selected_end_date - selected_start_date) > 365 then
    raise exception using errcode = '22023', message = 'ATTENDANCE_PERIOD_INVALID';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = selected_user_id
  ) then
    raise exception using errcode = '22023', message = 'ATTENDANCE_EMPLOYEE_INVALID';
  end if;

  return query
  select
    calendar.work_date,
    attendance.id,
    attendance.location_id,
    locations.name,
    locations.code,
    attendance.check_in_at,
    attendance.check_out_at
  from (
    select generated_date::date as work_date
    from pg_catalog.generate_series(
      selected_start_date::timestamp,
      selected_end_date::timestamp,
      interval '1 day'
    ) as series(generated_date)
  ) as calendar
  left join public.attendance
    on attendance.user_id = selected_user_id
   and attendance.work_date = calendar.work_date
  left join public.locations on locations.id = attendance.location_id
  order by calendar.work_date;
end;
$$;

revoke all on function public.attendance_period_report(uuid, date, date)
  from public, anon, authenticated;

grant execute on function public.attendance_period_report(uuid, date, date)
  to authenticated;

comment on constraint attendance_user_date_unique on public.attendance is
  'An employee can record attendance at only one location per Lima calendar day.';
comment on function public.attendance_period_report(uuid, date, date) is
  'Returns every calendar day in an employee attendance interval to active manager/admin users.';

commit;
