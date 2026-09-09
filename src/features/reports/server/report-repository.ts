import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  MonthlyReportFilters,
  PeriodReportFilters,
  ReportFilters,
} from "@/features/reports/schemas/report";
import type { Database } from "@/types/database.generated";

type ReportClient = SupabaseClient<Database>;

export function findReportLocations(supabase: ReportClient) {
  return supabase
    .from("locations")
    .select("id, name, code")
    .order("name");
}

export function findReportEmployees(supabase: ReportClient) {
  return supabase
    .from("profiles")
    .select("id, full_name")
    .eq("active", true)
    .order("full_name");
}

export function findReconciliationReport(
  supabase: ReportClient,
  filters: ReportFilters,
) {
  return supabase.rpc("management_reconciliation_report", {
    selected_date: filters.date,
    selected_location_id: filters.location_id,
    selected_user_id: filters.user_id,
  });
}

function monthlyRpcArgs(filters: MonthlyReportFilters) {
  return {
    selected_location_id: filters.monthly_location_id,
    selected_month: `${filters.month}-01`,
  };
}

export function findMonthlyDailyIncome(
  supabase: ReportClient,
  filters: MonthlyReportFilters,
) {
  return supabase.rpc("management_monthly_daily_income", monthlyRpcArgs(filters));
}

export function findMonthlyLocationIncome(
  supabase: ReportClient,
  filters: MonthlyReportFilters,
) {
  return supabase.rpc("management_monthly_location_income", monthlyRpcArgs(filters));
}

export function findMonthlyProductSales(
  supabase: ReportClient,
  filters: MonthlyReportFilters,
) {
  return supabase.rpc("management_monthly_product_sales", monthlyRpcArgs(filters));
}

function periodRpcArgs(filters: PeriodReportFilters) {
  return {
    selected_from: filters.from,
    selected_location_id: filters.location_id,
    selected_to: filters.to,
  };
}

export function findPeriodDailyIncome(
  supabase: ReportClient,
  filters: PeriodReportFilters,
) {
  return supabase.rpc("management_period_daily_income", periodRpcArgs(filters));
}

export function findPeriodLocationIncome(
  supabase: ReportClient,
  filters: PeriodReportFilters,
) {
  return supabase.rpc("management_period_location_income", periodRpcArgs(filters));
}

export function findPeriodProductSales(
  supabase: ReportClient,
  filters: PeriodReportFilters,
) {
  return supabase.rpc("management_period_product_sales", periodRpcArgs(filters));
}
