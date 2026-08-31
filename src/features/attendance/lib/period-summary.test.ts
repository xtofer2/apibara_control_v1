import { describe, expect, it } from "vitest";

import type { AttendancePeriodRow } from "@/features/attendance/types";

import { summarizeAttendancePeriod } from "./period-summary";

function periodRow(
  workDate: string,
  location?: { id: string; name: string },
): AttendancePeriodRow {
  return {
    attendance_id: location ? `attendance-${workDate}` : null,
    check_in_at: location ? `${workDate}T14:00:00Z` : null,
    check_out_at: location ? `${workDate}T22:00:00Z` : null,
    location_code: location ? location.name.toUpperCase() : null,
    location_id: location?.id ?? null,
    location_name: location?.name ?? null,
    work_date: workDate,
  };
}

describe("summarizeAttendancePeriod", () => {
  it("counts calendar days, attendance days and days without a record", () => {
    const rows = [
      periodRow("2026-07-05"),
      periodRow("2026-07-06", { id: "location-a", name: "Miguel Grau" }),
      periodRow("2026-07-07", { id: "location-a", name: "Miguel Grau" }),
    ];

    expect(summarizeAttendancePeriod(rows)).toMatchObject({
      attendanceDays: 2,
      calendarDays: 3,
      missingDays: 1,
    });
  });

  it("groups attendance days by location", () => {
    const rows = [
      periodRow("2026-07-05", { id: "location-b", name: "Central" }),
      periodRow("2026-07-06", { id: "location-a", name: "Miguel Grau" }),
      periodRow("2026-07-07", { id: "location-a", name: "Miguel Grau" }),
    ];

    expect(summarizeAttendancePeriod(rows).locations).toEqual([
      { id: "location-a", name: "Miguel Grau", days: 2 },
      { id: "location-b", name: "Central", days: 1 },
    ]);
  });
});
