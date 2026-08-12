begin;

revoke insert on public.closings from authenticated;
revoke insert on public.closing_items from authenticated;
revoke insert on public.closing_payments from authenticated;

drop policy work_shifts_select_authorized on public.work_shifts;
create policy work_shifts_select_authorized
on public.work_shifts
for select
to authenticated
using (
  (select private.has_minimum_role('MANAGER'))
  or ((select private.is_active_user()) and status = 'OPEN')
  or exists (
    select 1
    from public.closings
    where closings.work_shift_id = work_shifts.id
      and closings.created_by = (select auth.uid())
  )
);

create function public.close_operational_shift(
  selected_work_shift_id uuid,
  selected_items jsonb,
  selected_payments jsonb
)
returns public.work_shifts
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  closed_shift public.work_shifts;
  new_closing_id uuid;
  parsed_count integer;
  distinct_count integer;
begin
  current_user_id = (select auth.uid());

  if current_user_id is null or not (select private.is_active_user()) then
    raise exception using errcode = '42501', message = 'CLOSING_FORBIDDEN';
  end if;

  perform 1 from public.work_shifts
  where id = selected_work_shift_id and status = 'OPEN'
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'CLOSING_SHIFT_NOT_OPEN';
  end if;

  if not exists (
    select 1 from public.openings where work_shift_id = selected_work_shift_id
  ) then
    raise exception using errcode = 'P0001', message = 'CLOSING_OPENING_REQUIRED';
  end if;

  if selected_items is null or jsonb_typeof(selected_items) <> 'array' then
    raise exception using errcode = 'P0001', message = 'CLOSING_INVALID_ITEMS';
  end if;

  lock table public.products in share mode;

  select count(*), count(distinct item.product_id)
  into parsed_count, distinct_count
  from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric);

  if parsed_count = 0 or parsed_count <> distinct_count then
    raise exception using errcode = 'P0001', message = 'CLOSING_INVALID_ITEMS';
  end if;

  if exists (
    select 1 from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric)
    where item.quantity is null or item.quantity < 0 or item.quantity <> round(item.quantity, 3)
  ) then
    raise exception using errcode = 'P0001', message = 'CLOSING_INVALID_QUANTITY';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric)
    join public.products on products.id = item.product_id
    where products.unit_type = 'UNIT' and item.quantity <> trunc(item.quantity)
  ) then
    raise exception using errcode = 'P0001', message = 'CLOSING_UNIT_QUANTITY_REQUIRED';
  end if;

  if exists (
    select id from public.products where active
    except
    select item.product_id from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric)
  ) or exists (
    select item.product_id from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric)
    except
    select id from public.products where active
  ) then
    raise exception using errcode = 'P0001', message = 'CLOSING_PRODUCT_SET_MISMATCH';
  end if;

  if selected_payments is null or jsonb_typeof(selected_payments) <> 'array' then
    raise exception using errcode = 'P0001', message = 'CLOSING_INVALID_PAYMENTS';
  end if;

  select count(*), count(distinct payment.code)
  into parsed_count, distinct_count
  from jsonb_to_recordset(selected_payments) as payment(code text, amount numeric);

  if parsed_count <> 2 or distinct_count <> 2
     or exists (
       select 1 from jsonb_to_recordset(selected_payments) as payment(code text, amount numeric)
       where payment.code not in ('CASH', 'YAPE')
          or payment.amount is null
          or payment.amount < 0
          or payment.amount <> round(payment.amount, 2)
     )
     or not exists (
       select 1 from jsonb_to_recordset(selected_payments) as payment(code text, amount numeric)
       where payment.code = 'CASH'
     )
     or not exists (
       select 1 from jsonb_to_recordset(selected_payments) as payment(code text, amount numeric)
       where payment.code = 'YAPE'
     ) then
    raise exception using errcode = 'P0001', message = 'CLOSING_INVALID_PAYMENTS';
  end if;

  if exists (
    select payment.code
    from jsonb_to_recordset(selected_payments) as payment(code text, amount numeric)
    left join public.payment_methods on payment_methods.code = payment.code and payment_methods.active
    where payment_methods.id is null
  ) then
    raise exception using errcode = 'P0001', message = 'CLOSING_PAYMENT_METHOD_UNAVAILABLE';
  end if;

  insert into public.closings (work_shift_id, created_by)
  values (selected_work_shift_id, current_user_id)
  returning id into new_closing_id;

  insert into public.closing_items (closing_id, product_id, quantity)
  select new_closing_id, item.product_id, item.quantity
  from jsonb_to_recordset(selected_items) as item(product_id uuid, quantity numeric);

  insert into public.closing_payments (closing_id, payment_method_id, amount)
  select new_closing_id, payment_methods.id, payment.amount
  from jsonb_to_recordset(selected_payments) as payment(code text, amount numeric)
  join public.payment_methods on payment_methods.code = payment.code;

  update public.work_shifts
  set status = 'CLOSED', closed_at = now()
  where id = selected_work_shift_id
  returning * into closed_shift;

  return closed_shift;
exception
  when unique_violation then
    raise exception using errcode = 'P0001', message = 'CLOSING_ALREADY_RECORDED';
end;
$$;

revoke all on function public.close_operational_shift(uuid, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.close_operational_shift(uuid, jsonb, jsonb)
  to authenticated;

comment on function public.close_operational_shift(uuid, jsonb, jsonb) is
  'Atomically records final product counts and CASH/YAPE payments, then closes the shift.';

commit;
