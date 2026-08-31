begin;

create or replace function public.management_monthly_product_sales(
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

commit;
