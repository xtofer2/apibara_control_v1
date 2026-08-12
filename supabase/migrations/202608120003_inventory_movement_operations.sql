begin;

revoke insert on public.inventory_movements from authenticated;
revoke insert on public.inventory_movement_items from authenticated;

create function public.create_inventory_movement(
  selected_work_shift_id uuid,
  selected_movement_type public.inventory_movement_type,
  selected_reason text,
  selected_notes text,
  selected_items jsonb
)
returns public.inventory_movements
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  new_movement public.inventory_movements;
  parsed_count integer;
  distinct_product_count integer;
  normalized_reason text := nullif(btrim(selected_reason), '');
  normalized_notes text := nullif(btrim(selected_notes), '');
begin
  current_user_id = (select auth.uid());

  if current_user_id is null
     or not (select private.is_active_user()) then
    raise exception using errcode = '42501', message = 'INVENTORY_FORBIDDEN';
  end if;

  if selected_movement_type in ('ADJUSTMENT_POSITIVE', 'ADJUSTMENT_NEGATIVE')
     and not (select private.has_minimum_role('MANAGER')) then
    raise exception using errcode = '42501', message = 'INVENTORY_ADJUSTMENT_FORBIDDEN';
  end if;

  perform 1
  from public.work_shifts
  where id = selected_work_shift_id
    and status = 'OPEN'
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'INVENTORY_SHIFT_NOT_OPEN';
  end if;

  if not exists (
    select 1
    from public.openings
    where work_shift_id = selected_work_shift_id
  ) then
    raise exception using errcode = 'P0001', message = 'INVENTORY_OPENING_REQUIRED';
  end if;

  if selected_movement_type = 'WASTE' then
    if normalized_reason is null
       or normalized_reason not in ('DAMAGED', 'DROPPED', 'PREPARATION', 'EXPIRED', 'OTHER') then
      raise exception using errcode = 'P0001', message = 'INVENTORY_WASTE_REASON_REQUIRED';
    end if;

    if normalized_reason = 'OTHER' and normalized_notes is null then
      raise exception using errcode = 'P0001', message = 'INVENTORY_OTHER_NOTES_REQUIRED';
    end if;
  elsif selected_movement_type in ('ADJUSTMENT_POSITIVE', 'ADJUSTMENT_NEGATIVE') then
    if normalized_reason is null or normalized_notes is null then
      raise exception using errcode = 'P0001', message = 'INVENTORY_ADJUSTMENT_DETAILS_REQUIRED';
    end if;
  else
    normalized_reason := null;
  end if;

  if selected_items is null or jsonb_typeof(selected_items) <> 'array' then
    raise exception using errcode = 'P0001', message = 'INVENTORY_INVALID_ITEMS';
  end if;

  select count(*), count(distinct item.product_id)
  into parsed_count, distinct_product_count
  from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric);

  if parsed_count = 0 or parsed_count <> distinct_product_count then
    raise exception using errcode = 'P0001', message = 'INVENTORY_INVALID_ITEMS';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric)
    where item.quantity is null
       or item.quantity <= 0
       or item.quantity <> round(item.quantity, 3)
  ) then
    raise exception using errcode = 'P0001', message = 'INVENTORY_INVALID_QUANTITY';
  end if;

  if exists (
    select item.product_id
    from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric)
    left join public.products on products.id = item.product_id and products.active
    where products.id is null
  ) then
    raise exception using errcode = 'P0001', message = 'INVENTORY_PRODUCT_UNAVAILABLE';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric)
    join public.products on products.id = item.product_id
    where products.unit_type = 'UNIT'
      and item.quantity <> trunc(item.quantity)
  ) then
    raise exception using errcode = 'P0001', message = 'INVENTORY_UNIT_QUANTITY_REQUIRED';
  end if;

  insert into public.inventory_movements (
    work_shift_id,
    movement_type,
    reason,
    notes,
    created_by
  ) values (
    selected_work_shift_id,
    selected_movement_type,
    normalized_reason,
    normalized_notes,
    current_user_id
  )
  returning * into new_movement;

  insert into public.inventory_movement_items (
    inventory_movement_id,
    product_id,
    quantity
  )
  select new_movement.id, item.product_id, item.quantity
  from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric);

  return new_movement;
end;
$$;

revoke all on function public.create_inventory_movement(
  uuid,
  public.inventory_movement_type,
  text,
  text,
  jsonb
) from public, anon, authenticated;

grant execute on function public.create_inventory_movement(
  uuid,
  public.inventory_movement_type,
  text,
  text,
  jsonb
) to authenticated;

comment on function public.create_inventory_movement(
  uuid,
  public.inventory_movement_type,
  text,
  text,
  jsonb
) is 'Creates an immutable inventory movement and its positive item quantities atomically for an open shift.';

commit;
