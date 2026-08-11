begin;

create unique index attendance_one_open_per_user_idx
  on public.attendance (user_id)
  where check_out_at is null;

revoke insert, update on public.attendance from authenticated;

create function public.attendance_check_in(selected_location_id uuid)
returns public.attendance
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
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

    raise exception using errcode = 'P0001', message = 'ATTENDANCE_ALREADY_RECORDED';
end;
$$;

create function public.attendance_check_out()
returns public.attendance
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  closed_attendance public.attendance;
begin
  current_user_id = (select auth.uid());

  if current_user_id is null
     or not (select private.is_active_user()) then
    raise exception using errcode = '42501', message = 'ATTENDANCE_FORBIDDEN';
  end if;

  update public.attendance
  set check_out_at = now()
  where user_id = current_user_id
    and check_out_at is null
  returning * into closed_attendance;

  if not found then
    raise exception using errcode = 'P0001', message = 'ATTENDANCE_NOT_OPEN';
  end if;

  return closed_attendance;
end;
$$;

create function public.attendance_manager_report(
  selected_date date,
  selected_location_id uuid default null,
  selected_user_id uuid default null
)
returns table (
  id uuid,
  user_id uuid,
  employee_name text,
  location_id uuid,
  location_name text,
  location_code text,
  work_date date,
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

  return query
  select
    attendance.id,
    attendance.user_id,
    profiles.full_name,
    attendance.location_id,
    locations.name,
    locations.code,
    attendance.work_date,
    attendance.check_in_at,
    attendance.check_out_at
  from public.attendance
  join public.profiles on profiles.id = attendance.user_id
  join public.locations on locations.id = attendance.location_id
  where attendance.work_date = selected_date
    and (
      selected_location_id is null
      or attendance.location_id = selected_location_id
    )
    and (
      selected_user_id is null
      or attendance.user_id = selected_user_id
    )
  order by attendance.check_in_at desc;
end;
$$;

revoke all on function public.attendance_check_in(uuid)
  from public, anon, authenticated;
revoke all on function public.attendance_check_out()
  from public, anon, authenticated;
revoke all on function public.attendance_manager_report(date, uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.attendance_check_in(uuid) to authenticated;
grant execute on function public.attendance_check_out() to authenticated;
grant execute on function public.attendance_manager_report(date, uuid, uuid)
  to authenticated;

comment on function public.attendance_check_in(uuid) is
  'Creates one server-timestamped attendance check-in for the authenticated active user.';
comment on function public.attendance_check_out() is
  'Closes the authenticated active user current attendance using the server timestamp.';
comment on function public.attendance_manager_report(date, uuid, uuid) is
  'Returns attendance report rows only to active manager/admin users.';

commit;
