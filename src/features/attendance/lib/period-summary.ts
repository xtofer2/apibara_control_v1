import type { AttendancePeriodRow } from "@/features/attendance/types";

export type AttendancePeriodSummary = {
  attendanceDays: number;
  calendarDays: number;
  locations: Array<{
    id: string;
    name: string;
    days: number;
  }>;
  missingDays: number;
};

export function summarizeAttendancePeriod(
  rows: AttendancePeriodRow[],
): AttendancePeriodSummary {
  const locations = new Map<string, { id: string; name: string; days: number }>();
  let attendanceDays = 0;

  for (const row of rows) {
    if (!row.attendance_id || !row.location_id || !row.location_name) {
      continue;
    }

    attendanceDays += 1;
    const current = locations.get(row.location_id);

    locations.set(row.location_id, {
      id: row.location_id,
      name: row.location_name,
      days: (current?.days ?? 0) + 1,
    });
  }

  return {
    attendanceDays,
    calendarDays: rows.length,
    locations: [...locations.values()].sort(
      (left, right) => right.days - left.days || left.name.localeCompare(right.name),
    ),
    missingDays: rows.length - attendanceDays,
  };
}
