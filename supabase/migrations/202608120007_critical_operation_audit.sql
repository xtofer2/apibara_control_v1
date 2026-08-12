begin;

revoke update, delete on public.audit_logs from authenticated;

create function private.audit_opening_items_inserted()
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

create trigger opening_items_audit_statement
after insert on public.opening_items
referencing new table as inserted_opening_items
for each statement execute function private.audit_opening_items_inserted();

create function private.audit_inventory_items_inserted()
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
    inventory_movements.created_by,
    'INVENTORY_' || inventory_movements.movement_type::text,
    'inventory_movement',
    inventory_movements.id,
    jsonb_build_object(
      'work_shift_id', work_shifts.id,
      'location_id', locations.id,
      'location_name', locations.name,
      'movement_type', inventory_movements.movement_type,
      'reason', inventory_movements.reason,
      'notes', inventory_movements.notes,
      'items', (
        select jsonb_agg(
          jsonb_build_object(
            'product_id', products.id,
            'product_name', products.name,
            'quantity', inventory_movement_items.quantity
          ) order by products.display_order, products.name
        )
        from public.inventory_movement_items
        join public.products on products.id = inventory_movement_items.product_id
        where inventory_movement_items.inventory_movement_id = inventory_movements.id
      )
    )
  from (
    select distinct inventory_movement_id from inserted_movement_items
  ) inserted
  join public.inventory_movements
    on inventory_movements.id = inserted.inventory_movement_id
  join public.work_shifts on work_shifts.id = inventory_movements.work_shift_id
  join public.locations on locations.id = work_shifts.location_id;

  return null;
end;
$$;

create trigger inventory_movement_items_audit_statement
after insert on public.inventory_movement_items
referencing new table as inserted_movement_items
for each statement execute function private.audit_inventory_items_inserted();

create function private.audit_closing_payments_inserted()
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
    closings.created_by,
    'SHIFT_CLOSED',
    'work_shift',
    work_shifts.id,
    jsonb_build_object(
      'closing_id', closings.id,
      'location_id', locations.id,
      'location_name', locations.name,
      'operational_date', work_shifts.operational_date,
      'items', (
        select jsonb_agg(
          jsonb_build_object(
            'product_id', products.id,
            'product_name', products.name,
            'quantity', closing_items.quantity
          ) order by products.display_order, products.name
        )
        from public.closing_items
        join public.products on products.id = closing_items.product_id
        where closing_items.closing_id = closings.id
      ),
      'payments', (
        select jsonb_agg(
          jsonb_build_object(
            'code', payment_methods.code,
            'name', payment_methods.name,
            'amount', closing_payments.amount
          ) order by payment_methods.code
        )
        from public.closing_payments
        join public.payment_methods
          on payment_methods.id = closing_payments.payment_method_id
        where closing_payments.closing_id = closings.id
      )
    )
  from (
    select distinct closing_id from inserted_closing_payments
  ) inserted
  join public.closings on closings.id = inserted.closing_id
  join public.work_shifts on work_shifts.id = closings.work_shift_id
  join public.locations on locations.id = work_shifts.location_id;

  return null;
end;
$$;

create trigger closing_payments_audit_statement
after insert on public.closing_payments
referencing new table as inserted_closing_payments
for each statement execute function private.audit_closing_payments_inserted();

create function private.audit_transfer_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  audit_action text;
  actor_id uuid;
begin
  if new.status = old.status then
    return new;
  end if;

  audit_action := case new.status
    when 'SENT' then 'TRANSFER_SENT'
    when 'RECEIVED' then 'TRANSFER_RECEIVED'
    when 'RECEIVED_WITH_DIFFERENCES' then 'TRANSFER_RECEIVED_WITH_DIFFERENCES'
    when 'CANCELLED' then 'TRANSFER_CANCELLED'
    else null
  end;

  if audit_action is null then
    return new;
  end if;

  actor_id := case
    when new.status = 'SENT' then new.sent_by
    when new.status in ('RECEIVED', 'RECEIVED_WITH_DIFFERENCES') then new.received_by
    when new.status = 'CANCELLED' then new.cancelled_by
  end;

  insert into public.audit_logs (
    user_id, action, entity_type, entity_id, old_data, new_data
  ) values (
    actor_id,
    audit_action,
    'transfer',
    new.id,
    jsonb_build_object('status', old.status),
    jsonb_build_object(
      'status', new.status,
      'origin_location_id', new.origin_location_id,
      'origin_location_name', (
        select name from public.locations where id = new.origin_location_id
      ),
      'destination_location_id', new.destination_location_id,
      'destination_location_name', (
        select name from public.locations where id = new.destination_location_id
      ),
      'origin_work_shift_id', new.origin_work_shift_id,
      'destination_work_shift_id', new.destination_work_shift_id,
      'reception_notes', new.reception_notes,
      'cancellation_reason', new.cancellation_reason,
      'items', (
        select jsonb_agg(
          jsonb_build_object(
            'product_id', products.id,
            'product_name', products.name,
            'sent_quantity', transfer_items.sent_quantity,
            'received_quantity', transfer_items.received_quantity
          ) order by products.display_order, products.name
        )
        from public.transfer_items
        join public.products on products.id = transfer_items.product_id
        where transfer_items.transfer_id = new.id
      )
    )
  );

  return new;
end;
$$;

create trigger transfers_audit_transition
after update on public.transfers
for each row execute function private.audit_transfer_transition();

create function private.audit_administrative_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  old_snapshot jsonb := to_jsonb(old) - 'updated_at';
  new_snapshot jsonb := to_jsonb(new) - 'updated_at';
begin
  if actor_id is null or old_snapshot = new_snapshot then
    return new;
  end if;

  insert into public.audit_logs (
    user_id, action, entity_type, entity_id, old_data, new_data
  ) values (
    actor_id,
    'ADMIN_UPDATE',
    tg_table_name,
    new.id,
    old_snapshot,
    new_snapshot
  );

  return new;
end;
$$;

create trigger profiles_audit_administrative_update
after update on public.profiles
for each row execute function private.audit_administrative_update();

create trigger locations_audit_administrative_update
after update on public.locations
for each row execute function private.audit_administrative_update();

create trigger products_audit_administrative_update
after update on public.products
for each row execute function private.audit_administrative_update();

create trigger payment_methods_audit_administrative_update
after update on public.payment_methods
for each row execute function private.audit_administrative_update();

revoke all on function private.audit_opening_items_inserted()
  from public, anon, authenticated;
revoke all on function private.audit_inventory_items_inserted()
  from public, anon, authenticated;
revoke all on function private.audit_closing_payments_inserted()
  from public, anon, authenticated;
revoke all on function private.audit_transfer_transition()
  from public, anon, authenticated;
revoke all on function private.audit_administrative_update()
  from public, anon, authenticated;

comment on table public.audit_logs is
  'Immutable manager-visible history of critical operational and administrative actions.';

commit;
