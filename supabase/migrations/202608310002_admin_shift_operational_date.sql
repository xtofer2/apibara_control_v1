begin;

alter table public.work_shifts
  drop constraint work_shifts_operational_date_matches_opening;

create function private.create_operational_shift(
  selected_location_id uuid,
  selected_cash_opening numeric,
  selected_items jsonb,
  selected_operational_date date
)
returns public.work_shifts
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  new_shift public.work_shifts;
  new_opening_id uuid;
  parsed_count integer;
  distinct_product_count integer;
begin
  current_user_id = (select auth.uid());

  if current_user_id is null
     or not (select private.is_active_user()) then
    raise exception using errcode = '42501', message = 'SHIFT_FORBIDDEN';
  end if;

  if selected_operational_date is null then
    raise exception using errcode = 'P0001', message = 'SHIFT_INVALID_DATE';
  end if;

  perform 1
  from public.locations
  where id = selected_location_id
    and active
  for share;

  if not found then
    raise exception using errcode = 'P0001', message = 'SHIFT_LOCATION_UNAVAILABLE';
  end if;

  if selected_cash_opening is null
     or selected_cash_opening < 0
     or selected_cash_opening <> round(selected_cash_opening, 2) then
    raise exception using errcode = 'P0001', message = 'SHIFT_INVALID_CASH';
  end if;

  if selected_items is null
     or jsonb_typeof(selected_items) <> 'array' then
    raise exception using errcode = 'P0001', message = 'SHIFT_INVALID_ITEMS';
  end if;

  lock table public.products in share mode;

  select count(*), count(distinct item.product_id)
  into parsed_count, distinct_product_count
  from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric);

  if parsed_count = 0 or parsed_count <> distinct_product_count then
    raise exception using errcode = 'P0001', message = 'SHIFT_INVALID_ITEMS';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric)
    where item.quantity is null
       or item.quantity < 0
       or item.quantity <> round(item.quantity, 3)
  ) then
    raise exception using errcode = 'P0001', message = 'SHIFT_INVALID_QUANTITY';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric)
    join public.products on products.id = item.product_id
    where products.unit_type = 'UNIT'
      and item.quantity <> trunc(item.quantity)
  ) then
    raise exception using errcode = 'P0001', message = 'SHIFT_UNIT_QUANTITY_REQUIRED';
  end if;

  if exists (
    select products.id
    from public.products
    where products.active
    except
    select item.product_id
    from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric)
  ) or exists (
    select item.product_id
    from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric)
    except
    select products.id
    from public.products
    where products.active
  ) then
    raise exception using errcode = 'P0001', message = 'SHIFT_PRODUCT_SET_MISMATCH';
  end if;

  insert into public.work_shifts (location_id, operational_date)
  values (selected_location_id, selected_operational_date)
  returning * into new_shift;

  insert into public.openings (work_shift_id, created_by, cash_opening)
  values (new_shift.id, current_user_id, selected_cash_opening)
  returning id into new_opening_id;

  insert into public.opening_items (opening_id, product_id, quantity)
  select new_opening_id, item.product_id, item.quantity
  from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric);

  return new_shift;
exception
  when unique_violation then
    if exists (
      select 1
      from public.work_shifts
      where location_id = selected_location_id
        and status = 'OPEN'
    ) then
      raise exception using errcode = 'P0001', message = 'SHIFT_ALREADY_OPEN';
    end if;

    raise exception using errcode = 'P0001', message = 'SHIFT_ALREADY_RECORDED';
end;
$$;

revoke all on function private.create_operational_shift(uuid, numeric, jsonb, date)
  from public, anon, authenticated;

create or replace function public.open_operational_shift(
  selected_location_id uuid,
  selected_cash_opening numeric,
  selected_items jsonb
)
returns public.work_shifts
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.create_operational_shift(
    selected_location_id,
    selected_cash_opening,
    selected_items,
    ((now() at time zone 'America/Lima')::date)
  );
end;
$$;

create function public.open_operational_shift_for_date(
  selected_location_id uuid,
  selected_cash_opening numeric,
  selected_items jsonb,
  selected_operational_date date
)
returns public.work_shifts
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.has_minimum_role('ADMIN')) then
    raise exception using errcode = '42501', message = 'SHIFT_DATE_FORBIDDEN';
  end if;

  return private.create_operational_shift(
    selected_location_id,
    selected_cash_opening,
    selected_items,
    selected_operational_date
  );
end;
$$;

revoke all on function public.open_operational_shift_for_date(uuid, numeric, jsonb, date)
  from public, anon, authenticated;
grant execute on function public.open_operational_shift_for_date(uuid, numeric, jsonb, date)
  to authenticated;

create or replace function private.audit_opening_items_inserted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_logs (
    user_id, action, entity_type, entity_id, new_data
  )
  select
    openings.created_by,
    'SHIFT_OPENED',
    'work_shift',
    work_shifts.id,
    jsonb_build_object(
      'location_id', locations.id,
      'location_name', locations.name,
      'operational_date', work_shifts.operational_date,
      'opened_at', work_shifts.opened_at,
      'cash_opening', openings.cash_opening,
      'items', (
        select jsonb_agg(
          jsonb_build_object(
            'product_id', products.id,
            'product_name', products.name,
            'quantity', opening_items.quantity
          ) order by products.display_order, products.name
        )
        from public.opening_items
        join public.products on products.id = opening_items.product_id
        where opening_items.opening_id = openings.id
      )
    )
  from (
    select distinct opening_id from inserted_opening_items
  ) inserted
  join public.openings on openings.id = inserted.opening_id
  join public.work_shifts on work_shifts.id = openings.work_shift_id
  join public.locations on locations.id = work_shifts.location_id;

  return null;
end;
$$;

comment on function public.open_operational_shift_for_date(uuid, numeric, jsonb, date) is
  'Allows only active administrators to create a shift for an explicitly selected operational date while preserving server timestamps.';

commit;
