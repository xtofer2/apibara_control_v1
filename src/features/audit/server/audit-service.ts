import "server-only";

import type { AuditFilters } from "@/features/audit/schemas/audit";
import type { AuditRow } from "@/features/audit/types";
import { createClient } from "@/lib/supabase/server";

import { findAuditEmployees, findAuditRows } from "./audit-repository";

export class AuditServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuditServiceError";
  }
}

export async function getAuditDashboard(filters: AuditFilters) {
  const supabase = await createClient();
  const [rowsResult, employeesResult] = await Promise.all([
    findAuditRows(supabase, filters),
    findAuditEmployees(supabase),
  ]);
  const error = rowsResult.error ?? employeesResult.error;

  if (error) {
    throw new AuditServiceError("No se pudo cargar el historial de auditoría.");
  }

  return {
    rows: (rowsResult.data ?? []) as AuditRow[],
    employees: employeesResult.data ?? [],
  };
}
