import { describe, expect, it } from "vitest";

import {
  getMonthIntervals,
  getWeekIntervals,
  startOfWeek,
} from "./report-period";

describe("business report periods", () => {
  it("uses Monday as the start of the selected week", () => {
    expect(startOfWeek("2026-09-08")).toBe("2026-09-07");
    expect(startOfWeek("2026-09-13")).toBe("2026-09-07");
  });

  it("compares a partial current week with the same elapsed days", () => {
    expect(getWeekIntervals("2026-09-08", "2026-09-08")).toEqual({
      current: { from: "2026-09-07", to: "2026-09-08" },
      previous: { from: "2026-08-31", to: "2026-09-01" },
    });
  });

  it("compares a partial month with the same elapsed days", () => {
    expect(getMonthIntervals("2026-09", "2026-09-08")).toEqual({
      current: { from: "2026-09-01", to: "2026-09-08" },
      previous: { from: "2026-08-01", to: "2026-08-08" },
    });
  });

  it("does not extend the comparison beyond a shorter previous month", () => {
    expect(getMonthIntervals("2026-03", "2026-09-08")).toEqual({
      current: { from: "2026-03-01", to: "2026-03-31" },
      previous: { from: "2026-02-01", to: "2026-02-28" },
    });
  });
});
