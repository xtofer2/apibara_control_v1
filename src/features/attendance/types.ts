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

export type AttendanceFilterOption = {
  id: string;
  label: string;
};
