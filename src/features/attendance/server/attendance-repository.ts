import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AttendanceReportFilters } from "@/features/attendance/schemas/attendance";
import type { Database } from "@/types/database.generated";

type AttendanceClient = SupabaseClient<Database>;

const attendanceSelect = `
  id,
  user_id,
  location_id,
  work_date,
  check_in_at,
  check_out_at,
  created_at,
  updated_at,
  location:locations(id, name, code)
`;

export async function findOpenAttendance(
  supabase: AttendanceClient,
  userId: string,
) {
  return supabase
    .from("attendance")
    .select(attendanceSelect)
    .eq("user_id", userId)
    .is("check_out_at", null)
    .maybeSingle();
}

export async function findRecentAttendance(
  supabase: AttendanceClient,
  userId: string,
) {
  return supabase
    .from("attendance")
    .select(attendanceSelect)
    .eq("user_id", userId)
    .order("check_in_at", { ascending: false })
    .limit(7);
}

export async function findActiveAttendanceLocations(
  supabase: AttendanceClient,
) {
  return supabase
    .from("locations")
    .select("id, name, code")
    .eq("active", true)
    .order("name");
}

export async function findAttendanceEmployees(supabase: AttendanceClient) {
  return supabase
    .from("profiles")
    .select("id, full_name")
    .eq("active", true)
    .order("full_name");
}

export async function executeCheckIn(
  supabase: AttendanceClient,
  locationId: string,
) {
  return supabase.rpc("attendance_check_in", {
    selected_location_id: locationId,
  });
}

export async function executeCheckOut(supabase: AttendanceClient) {
  return supabase.rpc("attendance_check_out");
}

export async function findManagerAttendanceReport(
  supabase: AttendanceClient,
  filters: AttendanceReportFilters,
) {
  return supabase.rpc("attendance_manager_report", {
    selected_date: filters.date,
    selected_location_id: filters.location_id,
    selected_user_id: filters.user_id,
  });
}
