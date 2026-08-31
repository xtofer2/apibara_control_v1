import type { Database } from "@/types/database.generated";

export type AttendanceRow =
  Database["public"]["Tables"]["attendance"]["Row"];
export type AttendanceWithLocation = AttendanceRow & {
  location: {
    id: string;
    name: string;
    code: string;
  } | null;
};

type GeneratedReportRow =
  Database["public"]["Functions"]["attendance_manager_report"]["Returns"][number];

export type AttendanceReportRow = Omit<
  GeneratedReportRow,
  "check_out_at"
> & {
  check_out_at: string | null;
};

type GeneratedPeriodRow =
  Database["public"]["Functions"]["attendance_period_report"]["Returns"][number];

export type AttendancePeriodRow = Omit<
  GeneratedPeriodRow,
  "attendance_id" | "check_in_at" | "check_out_at" | "location_code" | "location_id" | "location_name"
> & {
  attendance_id: string | null;
  check_in_at: string | null;
  check_out_at: string | null;
  location_code: string | null;
  location_id: string | null;
  location_name: string | null;
};

export type AttendanceFilterOption = {
  id: string;
  label: string;
};
