begin;

revoke insert, update on public.transfers from authenticated;
revoke insert, update, delete on public.transfer_items from authenticated;

create function public.send_transfer(
  selected_origin_work_shift_id uuid,
  selected_destination_location_id uuid,
  selected_items jsonb
)
returns public.transfers
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  origin_location_id uuid;
  new_transfer public.transfers;
  parsed_count integer;
  distinct_product_count integer;
begin
  current_user_id = (select auth.uid());

  if current_user_id is null or not (select private.is_active_user()) then
    raise exception using errcode = '42501', message = 'TRANSFER_FORBIDDEN';
  end if;

  select work_shifts.location_id
  into origin_location_id
  from public.work_shifts
  where id = selected_origin_work_shift_id
    and status = 'OPEN'
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'TRANSFER_ORIGIN_SHIFT_NOT_OPEN';
  end if;

  if not exists (
    select 1 from public.openings
    where work_shift_id = selected_origin_work_shift_id
  ) then
    raise exception using errcode = 'P0001', message = 'TRANSFER_ORIGIN_OPENING_REQUIRED';
  end if;

  if selected_destination_location_id = origin_location_id then
    raise exception using errcode = 'P0001', message = 'TRANSFER_SAME_LOCATION';
  end if;

  if not exists (
    select 1 from public.locations
    where id = selected_destination_location_id and active
  ) then
    raise exception using errcode = 'P0001', message = 'TRANSFER_DESTINATION_UNAVAILABLE';
  end if;

  if selected_items is null or jsonb_typeof(selected_items) <> 'array' then
    raise exception using errcode = 'P0001', message = 'TRANSFER_INVALID_ITEMS';
  end if;

  select count(*), count(distinct item.product_id)
  into parsed_count, distinct_product_count
  from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric);

  if parsed_count = 0 or parsed_count <> distinct_product_count then
    raise exception using errcode = 'P0001', message = 'TRANSFER_INVALID_ITEMS';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric)
    where item.quantity is null
       or item.quantity <= 0
       or item.quantity <> round(item.quantity, 3)
  ) then
    raise exception using errcode = 'P0001', message = 'TRANSFER_INVALID_QUANTITY';
  end if;

  if exists (
    select item.product_id
    from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric)
    left join public.products on products.id = item.product_id and products.active
    where products.id is null
  ) then
    raise exception using errcode = 'P0001', message = 'TRANSFER_PRODUCT_UNAVAILABLE';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric)
    join public.products on products.id = item.product_id
    where products.unit_type = 'UNIT' and item.quantity <> trunc(item.quantity)
  ) then
    raise exception using errcode = 'P0001', message = 'TRANSFER_UNIT_QUANTITY_REQUIRED';
  end if;

  insert into public.transfers (
    origin_location_id,
    destination_location_id,
    origin_work_shift_id,
    created_by
  ) values (
    origin_location_id,
    selected_destination_location_id,
    selected_origin_work_shift_id,
    current_user_id
  ) returning * into new_transfer;

  insert into public.transfer_items (transfer_id, product_id, sent_quantity)
  select new_transfer.id, item.product_id, item.quantity
  from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric);

  update public.transfers
  set status = 'SENT', sent_by = current_user_id, sent_at = now()
  where id = new_transfer.id
  returning * into new_transfer;

  return new_transfer;
end;
$$;

create function public.receive_transfer(
  selected_transfer_id uuid,
  selected_destination_work_shift_id uuid,
  selected_reception_notes text,
  selected_items jsonb
)
returns public.transfers
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  current_transfer public.transfers;
  new_status public.transfer_status;
  normalized_notes text := nullif(btrim(selected_reception_notes), '');
  parsed_count integer;
  distinct_product_count integer;
  has_difference boolean;
begin
  current_user_id = (select auth.uid());

  if current_user_id is null or not (select private.is_active_user()) then
    raise exception using errcode = '42501', message = 'TRANSFER_FORBIDDEN';
  end if;

  select * into current_transfer
  from public.transfers
  where id = selected_transfer_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'TRANSFER_NOT_FOUND';
  end if;

  if current_transfer.status <> 'SENT' then
    raise exception using errcode = 'P0001', message = 'TRANSFER_NOT_RECEIVABLE';
  end if;

  if not exists (
    select 1 from public.work_shifts
    where id = selected_destination_work_shift_id
      and location_id = current_transfer.destination_location_id
      and status = 'OPEN'
  ) then
    raise exception using errcode = 'P0001', message = 'TRANSFER_DESTINATION_SHIFT_NOT_OPEN';
  end if;

  if not exists (
    select 1 from public.openings
    where work_shift_id = selected_destination_work_shift_id
  ) then
    raise exception using errcode = 'P0001', message = 'TRANSFER_DESTINATION_OPENING_REQUIRED';
  end if;

  if selected_items is null or jsonb_typeof(selected_items) <> 'array' then
    raise exception using errcode = 'P0001', message = 'TRANSFER_INVALID_RECEIPT';
  end if;

  select count(*), count(distinct item.product_id)
  into parsed_count, distinct_product_count
  from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric);

  if parsed_count = 0 or parsed_count <> distinct_product_count then
    raise exception using errcode = 'P0001', message = 'TRANSFER_INVALID_RECEIPT';
  end if;

  if exists (
    select transfer_items.product_id from public.transfer_items
    where transfer_id = selected_transfer_id
    except
    select item.product_id
    from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric)
  ) or exists (
    select item.product_id
    from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric)
    except
    select transfer_items.product_id from public.transfer_items
    where transfer_id = selected_transfer_id
  ) then
    raise exception using errcode = 'P0001', message = 'TRANSFER_RECEIPT_ITEM_MISMATCH';
  end if;

  if exists (
    select 1 from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric)
    where item.quantity is null or item.quantity < 0 or item.quantity <> round(item.quantity, 3)
  ) then
    raise exception using errcode = 'P0001', message = 'TRANSFER_INVALID_RECEIVED_QUANTITY';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric)
    join public.products on products.id = item.product_id
    where products.unit_type = 'UNIT' and item.quantity <> trunc(item.quantity)
  ) then
    raise exception using errcode = 'P0001', message = 'TRANSFER_UNIT_QUANTITY_REQUIRED';
  end if;

  select coalesce(bool_or(item.quantity <> transfer_items.sent_quantity), false)
  into has_difference
  from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric)
  join public.transfer_items
    on transfer_items.transfer_id = selected_transfer_id
   and transfer_items.product_id = item.product_id;

  if has_difference and normalized_notes is null then
    raise exception using errcode = 'P0001', message = 'TRANSFER_DIFFERENCE_NOTES_REQUIRED';
  end if;

  update public.transfer_items
  set received_quantity = item.quantity
  from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric)
  where transfer_items.transfer_id = selected_transfer_id
    and transfer_items.product_id = item.product_id;

  new_status := case when has_difference
    then 'RECEIVED_WITH_DIFFERENCES'::public.transfer_status
    else 'RECEIVED'::public.transfer_status
  end;

  update public.transfers
  set destination_work_shift_id = selected_destination_work_shift_id,
      status = new_status,
      received_by = current_user_id,
      received_at = now(),
      reception_notes = case when has_difference then normalized_notes else null end
  where id = selected_transfer_id
  returning * into current_transfer;

  return current_transfer;
end;
$$;

revoke all on function public.send_transfer(uuid, uuid, jsonb)
  from public, anon, authenticated;
revoke all on function public.receive_transfer(uuid, uuid, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.send_transfer(uuid, uuid, jsonb) to authenticated;
grant execute on function public.receive_transfer(uuid, uuid, text, jsonb) to authenticated;

comment on function public.send_transfer(uuid, uuid, jsonb) is
  'Atomically creates and sends a transfer from an open origin shift.';
comment on function public.receive_transfer(uuid, uuid, text, jsonb) is
  'Atomically records actual received quantities and completes a sent transfer.';

commit;
