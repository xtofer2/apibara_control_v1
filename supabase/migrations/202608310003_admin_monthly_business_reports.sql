begin;

create index work_shifts_operational_date_status_idx
  on public.work_shifts (operational_date, status);

create function public.management_monthly_daily_income(
  selected_month date,
  selected_location_id uuid default null
)
returns table (
  operational_date date,
  closed_shift_count bigint,
  open_shift_count bigint,
  cash_amount numeric,
  yape_amount numeric,
  total_income numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  month_start date;
  month_end date;
  current_lima_date date;
begin
  if not (select private.has_minimum_role('ADMIN')) then
    raise exception using errcode = '42501', message = 'REPORTS_ADMIN_ONLY';
  end if;

  current_lima_date = ((now() at time zone 'America/Lima')::date);
  month_start = date_trunc('month', selected_month)::date;

  if selected_month is null
     or month_start > date_trunc('month', current_lima_date)::date then
    raise exception using errcode = '22023', message = 'MONTHLY_REPORT_INVALID_MONTH';
  end if;

  month_end = least(
    (month_start + interval '1 month - 1 day')::date,
    current_lima_date
  );

  return query
  with calendar as (
    select generated_date::date as operational_date
    from pg_catalog.generate_series(
      month_start::timestamp,
      month_end::timestamp,
      interval '1 day'
    ) as series(generated_date)
  ),
  payment_totals as (
    select
      closings.work_shift_id,
      coalesce(sum(closing_payments.amount) filter (
        where payment_methods.code = 'CASH'
      ), 0) as cash_amount,
      coalesce(sum(closing_payments.amount) filter (
        where payment_methods.code = 'YAPE'
      ), 0) as yape_amount,
      coalesce(sum(closing_payments.amount), 0) as total_income
    from public.closings
    join public.closing_payments
      on closing_payments.closing_id = closings.id
    join public.payment_methods
      on payment_methods.id = closing_payments.payment_method_id
    group by closings.work_shift_id
  )
  select
    calendar.operational_date,
    count(work_shifts.id) filter (where work_shifts.status = 'CLOSED'),
    count(work_shifts.id) filter (where work_shifts.status = 'OPEN'),
    coalesce(sum(payment_totals.cash_amount) filter (
      where work_shifts.status = 'CLOSED'
    ), 0),
    coalesce(sum(payment_totals.yape_amount) filter (
      where work_shifts.status = 'CLOSED'
    ), 0),
    coalesce(sum(payment_totals.total_income) filter (
      where work_shifts.status = 'CLOSED'
    ), 0)
  from calendar
  left join public.work_shifts
    on work_shifts.operational_date = calendar.operational_date
   and (
     selected_location_id is null
     or work_shifts.location_id = selected_location_id
   )
  left join payment_totals on payment_totals.work_shift_id = work_shifts.id
  group by calendar.operational_date
  order by calendar.operational_date;
end;
$$;

create function public.management_monthly_location_income(
  selected_month date,
  selected_location_id uuid default null
)
returns table (
  location_id uuid,
  location_name text,
  location_code text,
  closed_shift_count bigint,
  cash_amount numeric,
  yape_amount numeric,
  total_income numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  month_start date;
  month_end date;
  current_lima_date date;
begin
  if not (select private.has_minimum_role('ADMIN')) then
    raise exception using errcode = '42501', message = 'REPORTS_ADMIN_ONLY';
  end if;

  current_lima_date = ((now() at time zone 'America/Lima')::date);
  month_start = date_trunc('month', selected_month)::date;

  if selected_month is null
     or month_start > date_trunc('month', current_lima_date)::date then
    raise exception using errcode = '22023', message = 'MONTHLY_REPORT_INVALID_MONTH';
  end if;

  month_end = least(
    (month_start + interval '1 month - 1 day')::date,
    current_lima_date
  );

  return query
  with payment_totals as (
    select
      closings.work_shift_id,
      coalesce(sum(closing_payments.amount) filter (
        where payment_methods.code = 'CASH'
      ), 0) as cash_amount,
      coalesce(sum(closing_payments.amount) filter (
        where payment_methods.code = 'YAPE'
      ), 0) as yape_amount,
      coalesce(sum(closing_payments.amount), 0) as total_income
    from public.closings
    join public.closing_payments
      on closing_payments.closing_id = closings.id
    join public.payment_methods
      on payment_methods.id = closing_payments.payment_method_id
    group by closings.work_shift_id
  )
  select
    locations.id,
    locations.name,
    locations.code,
    count(work_shifts.id),
    coalesce(sum(payment_totals.cash_amount), 0),
    coalesce(sum(payment_totals.yape_amount), 0),
    coalesce(sum(payment_totals.total_income), 0)
  from public.locations
  left join public.work_shifts
    on work_shifts.location_id = locations.id
   and work_shifts.status = 'CLOSED'
   and work_shifts.operational_date between month_start and month_end
  left join payment_totals on payment_totals.work_shift_id = work_shifts.id
  where (
    selected_location_id is null
    or locations.id = selected_location_id
  )
    and (
      locations.active
      or work_shifts.id is not null
    )
  group by locations.id, locations.name, locations.code
  order by coalesce(sum(payment_totals.total_income), 0) desc, locations.name;
end;
$$;

create function public.management_monthly_product_sales(
  selected_month date,
  selected_location_id uuid default null
)
returns table (
  product_id uuid,
  product_name text,
  product_code text,
  unit_type public.product_unit,
  calculated_sales numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  month_start date;
  month_end date;
  current_lima_date date;
begin
  if not (select private.has_minimum_role('ADMIN')) then
    raise exception using errcode = '42501', message = 'REPORTS_ADMIN_ONLY';
  end if;

  current_lima_date = ((now() at time zone 'America/Lima')::date);
  month_start = date_trunc('month', selected_month)::date;

  if selected_month is null
     or month_start > date_trunc('month', current_lima_date)::date then
    raise exception using errcode = '22023', message = 'MONTHLY_REPORT_INVALID_MONTH';
  end if;

  month_end = least(
    (month_start + interval '1 month - 1 day')::date,
    current_lima_date
  );

  return query
  with report_rows as (
    select report.*
    from pg_catalog.generate_series(
      month_start::timestamp,
      month_end::timestamp,
      interval '1 day'
    ) as series(generated_date)
    cross join lateral public.management_reconciliation_report(
      generated_date::date,
      selected_location_id,
      null::uuid
    ) as report
  )
  select
    report_rows.product_id,
    report_rows.product_name,
    report_rows.product_code,
    report_rows.unit_type,
    sum(report_rows.calculated_sales)
  from report_rows
  group by
    report_rows.product_id,
    report_rows.product_name,
    report_rows.product_code,
    report_rows.unit_type
  order by
    report_rows.unit_type,
    sum(report_rows.calculated_sales) desc,
    report_rows.product_name;
end;
$$;

revoke all on function public.management_monthly_daily_income(date, uuid)
  from public, anon, authenticated;
revoke all on function public.management_monthly_location_income(date, uuid)
  from public, anon, authenticated;
revoke all on function public.management_monthly_product_sales(date, uuid)
  from public, anon, authenticated;

grant execute on function public.management_monthly_daily_income(date, uuid)
  to authenticated;
grant execute on function public.management_monthly_location_income(date, uuid)
  to authenticated;
grant execute on function public.management_monthly_product_sales(date, uuid)
  to authenticated;

comment on function public.management_monthly_daily_income(date, uuid) is
  'Returns admin-only daily payment income and shift coverage for a selected month.';
comment on function public.management_monthly_location_income(date, uuid) is
  'Returns admin-only monthly payment income grouped by location without duplicating payments per product.';
comment on function public.management_monthly_product_sales(date, uuid) is
  'Returns admin-only monthly calculated product quantities from closed shift reconciliation.';

commit;
