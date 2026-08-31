begin;

create or replace function public.management_monthly_location_income(
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

commit;
