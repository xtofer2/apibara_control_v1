import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import { getPreviousMonth } from "@/features/reports/lib/monthly-summary";
import type {
  MonthlyReportFilters,
  ReportFilters,
} from "@/features/reports/schemas/report";
import type {
  MonthlyDailyIncomeRow,
  MonthlyLocationIncomeRow,
  MonthlyProductSalesRow,
  ReconciliationRow,
} from "@/features/reports/types";
import { createClient } from "@/lib/supabase/server";

import {
  findMonthlyDailyIncome,
  findMonthlyLocationIncome,
  findMonthlyProductSales,
  findReconciliationReport,
  findReportEmployees,
  findReportLocations,
} from "./report-repository";

export class ReportServiceError extends Error {
  constructor(
    public readonly code: "FORBIDDEN" | "INVALID_MONTH" | "UNKNOWN",
    message: string,
  ) {
    super(message);
    this.name = "ReportServiceError";
  }
}

function toReportServiceError(error: PostgrestError) {
  if (
    error.message === "REPORTS_FORBIDDEN"
    || error.message === "REPORTS_ADMIN_ONLY"
  ) {
    return new ReportServiceError(
      "FORBIDDEN",
      "Tu cuenta no puede consultar reportes gerenciales.",
    );
  }

  if (error.message === "MONTHLY_REPORT_INVALID_MONTH") {
    return new ReportServiceError(
      "INVALID_MONTH",
      "El mes seleccionado no es válido para el reporte.",
    );
  }

  return new ReportServiceError(
    "UNKNOWN",
    "No se pudo cargar la conciliación gerencial.",
  );
}

export async function getAdminMonthlyBusinessReport(
  filters: MonthlyReportFilters,
) {
  const supabase = await createClient();
  const previousFilters = {
    ...filters,
    month: getPreviousMonth(filters.month),
  };
  const [daysResult, previousDaysResult, locationsResult, productsResult] =
    await Promise.all([
      findMonthlyDailyIncome(supabase, filters),
      findMonthlyDailyIncome(supabase, previousFilters),
      findMonthlyLocationIncome(supabase, filters),
      findMonthlyProductSales(supabase, filters),
    ]);
  const error =
    daysResult.error
    ?? previousDaysResult.error
    ?? locationsResult.error
    ?? productsResult.error;

  if (error) {
    throw toReportServiceError(error);
  }

  return {
    days: (daysResult.data ?? []) as MonthlyDailyIncomeRow[],
    locations: (locationsResult.data ?? []) as MonthlyLocationIncomeRow[],
    previousDays: (previousDaysResult.data ?? []) as MonthlyDailyIncomeRow[],
    products: (productsResult.data ?? []) as MonthlyProductSalesRow[],
  };
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
