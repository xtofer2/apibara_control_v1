begin;

create function public.management_reconciliation_report(
  selected_date date,
  selected_location_id uuid default null,
  selected_user_id uuid default null
)
returns table (
  work_shift_id uuid,
  operational_date date,
  location_id uuid,
  location_name text,
  location_code text,
  opened_at timestamptz,
  closed_at timestamptz,
  opened_by_name text,
  closed_by_name text,
  product_id uuid,
  product_name text,
  product_code text,
  unit_type public.product_unit,
  opening_quantity numeric,
  entry_quantity numeric,
  received_transfer_quantity numeric,
  positive_adjustment_quantity numeric,
  sent_transfer_quantity numeric,
  waste_quantity numeric,
  negative_adjustment_quantity numeric,
  closing_quantity numeric,
  calculated_sales numeric,
  cash_amount numeric,
  yape_amount numeric,
  closing_total numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select private.has_minimum_role('MANAGER')) then
    raise exception using errcode = '42501', message = 'REPORTS_FORBIDDEN';
  end if;

  return query
  with movement_totals as (
    select
      inventory_movements.work_shift_id,
      inventory_movement_items.product_id,
      sum(inventory_movement_items.quantity) filter (
        where inventory_movements.movement_type = 'ENTRY'
      ) as entry_quantity,
      sum(inventory_movement_items.quantity) filter (
        where inventory_movements.movement_type = 'WASTE'
      ) as waste_quantity,
      sum(inventory_movement_items.quantity) filter (
        where inventory_movements.movement_type = 'ADJUSTMENT_POSITIVE'
      ) as positive_adjustment_quantity,
      sum(inventory_movement_items.quantity) filter (
        where inventory_movements.movement_type = 'ADJUSTMENT_NEGATIVE'
      ) as negative_adjustment_quantity
    from public.inventory_movements
    join public.inventory_movement_items
      on inventory_movement_items.inventory_movement_id = inventory_movements.id
    group by inventory_movements.work_shift_id, inventory_movement_items.product_id
  ),
  sent_totals as (
    select
      transfers.origin_work_shift_id as work_shift_id,
      transfer_items.product_id,
      sum(transfer_items.sent_quantity) as quantity
    from public.transfers
    join public.transfer_items on transfer_items.transfer_id = transfers.id
    where transfers.status in ('SENT', 'RECEIVED', 'RECEIVED_WITH_DIFFERENCES')
    group by transfers.origin_work_shift_id, transfer_items.product_id
  ),
  received_totals as (
    select
      transfers.destination_work_shift_id as work_shift_id,
      transfer_items.product_id,
      sum(transfer_items.received_quantity) as quantity
    from public.transfers
    join public.transfer_items on transfer_items.transfer_id = transfers.id
    where transfers.status in ('RECEIVED', 'RECEIVED_WITH_DIFFERENCES')
    group by transfers.destination_work_shift_id, transfer_items.product_id
  ),
  payment_totals as (
    select
      closings.work_shift_id,
      sum(closing_payments.amount) filter (where payment_methods.code = 'CASH') as cash_amount,
      sum(closing_payments.amount) filter (where payment_methods.code = 'YAPE') as yape_amount,
      sum(closing_payments.amount) as closing_total
    from public.closings
    join public.closing_payments on closing_payments.closing_id = closings.id
    join public.payment_methods on payment_methods.id = closing_payments.payment_method_id
    group by closings.work_shift_id
  )
  select
    work_shifts.id,
    work_shifts.operational_date,
    locations.id,
    locations.name,
    locations.code,
    work_shifts.opened_at,
    work_shifts.closed_at,
    opening_profiles.full_name,
    closing_profiles.full_name,
    products.id,
    products.name,
    products.code,
    products.unit_type,
    opening_items.quantity,
    coalesce(movement_totals.entry_quantity, 0),
    coalesce(received_totals.quantity, 0),
    coalesce(movement_totals.positive_adjustment_quantity, 0),
    coalesce(sent_totals.quantity, 0),
    coalesce(movement_totals.waste_quantity, 0),
    coalesce(movement_totals.negative_adjustment_quantity, 0),
    closing_items.quantity,
    opening_items.quantity
      + coalesce(movement_totals.entry_quantity, 0)
      + coalesce(received_totals.quantity, 0)
      + coalesce(movement_totals.positive_adjustment_quantity, 0)
      - coalesce(sent_totals.quantity, 0)
      - coalesce(movement_totals.waste_quantity, 0)
      - coalesce(movement_totals.negative_adjustment_quantity, 0)
      - closing_items.quantity,
    coalesce(payment_totals.cash_amount, 0),
    coalesce(payment_totals.yape_amount, 0),
    coalesce(payment_totals.closing_total, 0)
  from public.work_shifts
  join public.locations on locations.id = work_shifts.location_id
  join public.openings on openings.work_shift_id = work_shifts.id
  join public.profiles opening_profiles on opening_profiles.id = openings.created_by
  join public.closings on closings.work_shift_id = work_shifts.id
  join public.profiles closing_profiles on closing_profiles.id = closings.created_by
  join public.closing_items on closing_items.closing_id = closings.id
  join public.products on products.id = closing_items.product_id
  join public.opening_items
    on opening_items.opening_id = openings.id
   and opening_items.product_id = products.id
  left join movement_totals
    on movement_totals.work_shift_id = work_shifts.id
   and movement_totals.product_id = products.id
  left join sent_totals
    on sent_totals.work_shift_id = work_shifts.id
   and sent_totals.product_id = products.id
  left join received_totals
    on received_totals.work_shift_id = work_shifts.id
   and received_totals.product_id = products.id
  left join payment_totals on payment_totals.work_shift_id = work_shifts.id
  where work_shifts.status = 'CLOSED'
    and work_shifts.operational_date = selected_date
    and (selected_location_id is null or work_shifts.location_id = selected_location_id)
    and (
      selected_user_id is null
      or openings.created_by = selected_user_id
      or closings.created_by = selected_user_id
      or exists (
        select 1 from public.inventory_movements
        where inventory_movements.work_shift_id = work_shifts.id
          and inventory_movements.created_by = selected_user_id
      )
      or exists (
        select 1 from public.transfers
        where (
          transfers.origin_work_shift_id = work_shifts.id
          or transfers.destination_work_shift_id = work_shifts.id
        ) and selected_user_id in (
          transfers.created_by,
          transfers.sent_by,
          transfers.received_by
        )
      )
    )
  order by locations.name, products.display_order, products.name;
end;
$$;

revoke all on function public.management_reconciliation_report(date, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.management_reconciliation_report(date, uuid, uuid)
  to authenticated;

comment on function public.management_reconciliation_report(date, uuid, uuid) is
  'Returns manager-only calculated sales reconciliation for closed shifts without persisting sales or totals.';

commit;
