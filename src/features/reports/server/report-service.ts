import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import type { ReportFilters } from "@/features/reports/schemas/report";
import type { ReconciliationRow } from "@/features/reports/types";
import { createClient } from "@/lib/supabase/server";

import {
  findReconciliationReport,
  findReportEmployees,
  findReportLocations,
} from "./report-repository";

export class ReportServiceError extends Error {
  constructor(
    public readonly code: "FORBIDDEN" | "UNKNOWN",
    message: string,
  ) {
    super(message);
    this.name = "ReportServiceError";
  }
}

function toReportServiceError(error: PostgrestError) {
  if (error.message === "REPORTS_FORBIDDEN") {
    return new ReportServiceError(
      "FORBIDDEN",
      "Tu cuenta no puede consultar reportes gerenciales.",
    );
  }

  return new ReportServiceError(
    "UNKNOWN",
    "No se pudo cargar la conciliación gerencial.",
  );
}

export async function getManagementReport(filters: ReportFilters) {
  const supabase = await createClient();
  const [rowsResult, locationsResult, employeesResult] = await Promise.all([
    findReconciliationReport(supabase, filters),
    findReportLocations(supabase),
    findReportEmployees(supabase),
  ]);
  const error =
    rowsResult.error ?? locationsResult.error ?? employeesResult.error;

  if (error) {
    throw toReportServiceError(error);
  }

  return {
    rows: (rowsResult.data ?? []) as ReconciliationRow[],
    locations: locationsResult.data ?? [],
    employees: employeesResult.data ?? [],
  };
}
