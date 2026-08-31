import { describe, expect, it } from "vitest";

import type { MonthlyDailyIncomeRow } from "@/features/reports/types";

import { getPreviousMonth, summarizeMonthlyBusiness } from "./monthly-summary";

function day(
  operationalDate: string,
  totalIncome: number,
  closedShiftCount = totalIncome > 0 ? 1 : 0,
): MonthlyDailyIncomeRow {
  return {
    cash_amount: totalIncome,
    closed_shift_count: closedShiftCount,
    open_shift_count: 0,
    operational_date: operationalDate,
    total_income: totalIncome,
    yape_amount: 0,
  };
}

describe("monthly business summary", () => {
  it("identifies totals, average, highest and lowest closed days", () => {
    const summary = summarizeMonthlyBusiness({
      currentDays: [
        day("2026-08-01", 100),
        day("2026-08-02", 300),
        day("2026-08-03", 0, 1),
        day("2026-08-04", 0),
      ],
      currentLimaMonth: "2026-08",
      currentMonth: "2026-08",
      locations: [],
      previousDays: [day("2026-07-01", 100), day("2026-07-02", 100)],
      products: [],
    });

    expect(summary).toMatchObject({
      averageIncome: 400 / 3,
      daysWithClosing: 3,
      income: 400,
      noOperationDays: 1,
      variationPercent: 100,
      zeroIncomeDays: 1,
    });
    expect(summary.bestDay?.operational_date).toBe("2026-08-02");
    expect(summary.lowestDay?.operational_date).toBe("2026-08-03");
  });

  it("calculates the previous month across year boundaries", () => {
    expect(getPreviousMonth("2026-01")).toBe("2025-12");
  });
});
