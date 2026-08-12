import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ReportFilters } from "@/features/reports/schemas/report";
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
