import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import type {
  AttendancePeriodFilters,
  AttendanceReportFilters,
} from "@/features/attendance/schemas/attendance";
import type {
  AttendancePeriodRow,
  AttendanceReportRow,
  AttendanceWithLocation,
} from "@/features/attendance/types";
import { createClient } from "@/lib/supabase/server";

import {
  executeCheckIn,
  executeCheckOut,
  findActiveAttendanceLocations,
  findAttendanceEmployees,
  findManagerAttendancePeriodReport,
  findManagerAttendanceReport,
  findOpenAttendance,
  findRecentAttendance,
} from "./attendance-repository";

export class AttendanceServiceError extends Error {
  constructor(
    public readonly code:
      | "ALREADY_OPEN"
      | "ALREADY_RECORDED"
      | "NOT_OPEN"
      | "LOCATION_UNAVAILABLE"
      | "PERIOD_INVALID"
      | "EMPLOYEE_INVALID"
      | "FORBIDDEN"
      | "UNKNOWN",
    message: string,
  ) {
    super(message);
    this.name = "AttendanceServiceError";
  }
}

function toAttendanceServiceError(error: PostgrestError) {
  const messages: Record<
    string,
    { code: AttendanceServiceError["code"]; message: string }
  > = {
    ATTENDANCE_ALREADY_OPEN: {
      code: "ALREADY_OPEN",
      message: "Ya tienes una asistencia abierta.",
    },
    ATTENDANCE_ALREADY_RECORDED: {
      code: "ALREADY_RECORDED",
      message: error.details
        ? `Ya registraste asistencia hoy en ${error.details}.`
        : "Ya registraste asistencia hoy.",
    },
    ATTENDANCE_NOT_OPEN: {
      code: "NOT_OPEN",
      message: "No tienes una asistencia abierta para cerrar.",
    },
    ATTENDANCE_LOCATION_UNAVAILABLE: {
      code: "LOCATION_UNAVAILABLE",
      message: "La sede seleccionada no está disponible.",
    },
    ATTENDANCE_FORBIDDEN: {
      code: "FORBIDDEN",
      message: "Tu cuenta no puede registrar asistencia.",
    },
    ATTENDANCE_REPORT_FORBIDDEN: {
      code: "FORBIDDEN",
      message: "Tu rol no puede consultar este reporte.",
    },
    ATTENDANCE_PERIOD_INVALID: {
      code: "PERIOD_INVALID",
      message: "El intervalo de asistencia no es válido.",
    },
    ATTENDANCE_EMPLOYEE_INVALID: {
      code: "EMPLOYEE_INVALID",
      message: "El empleado seleccionado no existe.",
    },
  };
  const knownError = messages[error.message];

  if (knownError) {
    return new AttendanceServiceError(knownError.code, knownError.message);
  }

  return new AttendanceServiceError(
    "UNKNOWN",
    "No se pudo completar la operación de asistencia.",
  );
}

export async function getEmployeeAttendanceDashboard(userId: string) {
  const supabase = await createClient();
  const [openResult, recentResult, locationsResult] = await Promise.all([
    findOpenAttendance(supabase, userId),
    findRecentAttendance(supabase, userId),
    findActiveAttendanceLocations(supabase),
  ]);
  const error = openResult.error ?? recentResult.error ?? locationsResult.error;

  if (error) {
    throw toAttendanceServiceError(error);
  }

  return {
    current: (openResult.data ?? null) as AttendanceWithLocation | null,
    recent: (recentResult.data ?? []) as AttendanceWithLocation[],
    locations: locationsResult.data ?? [],
  };
}

export async function checkIn(locationId: string) {
  const supabase = await createClient();
  const { error } = await executeCheckIn(supabase, locationId);

  if (error) {
    throw toAttendanceServiceError(error);
  }
}

export async function checkOut() {
  const supabase = await createClient();
  const { error } = await executeCheckOut(supabase);

  if (error) {
    throw toAttendanceServiceError(error);
  }
}

export async function getManagerAttendanceDashboard(
  filters: AttendanceReportFilters,
) {
  const supabase = await createClient();
  const [reportResult, locationsResult, employeesResult] = await Promise.all([
    findManagerAttendanceReport(supabase, filters),
    findActiveAttendanceLocations(supabase),
    findAttendanceEmployees(supabase),
  ]);
  const error =
    reportResult.error ?? locationsResult.error ?? employeesResult.error;

  if (error) {
    throw toAttendanceServiceError(error);
  }

  return {
    rows: (reportResult.data ?? []) as AttendanceReportRow[],
    locations: locationsResult.data ?? [],
    employees: employeesResult.data ?? [],
  };
}

export async function getManagerAttendancePeriodReport(
  filters: AttendancePeriodFilters & { period_user_id: string },
) {
  const supabase = await createClient();
  const { data, error } = await findManagerAttendancePeriodReport(
    supabase,
    filters,
  );

  if (error) {
    throw toAttendanceServiceError(error);
  }

  return (data ?? []) as AttendancePeriodRow[];
}
