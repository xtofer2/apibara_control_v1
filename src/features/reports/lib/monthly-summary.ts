import type {
  MonthlyDailyIncomeRow,
  MonthlyLocationIncomeRow,
  MonthlyProductSalesRow,
} from "@/features/reports/types";

export function getPreviousMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 2, 1));

  return date.toISOString().slice(0, 7);
}

function totalIncome(rows: MonthlyDailyIncomeRow[]) {
  return rows.reduce((total, row) => total + row.total_income, 0);
}

export function summarizeBusinessPeriod({
  currentDays,
  locations,
  previousDays,
  products,
}: {
  currentDays: MonthlyDailyIncomeRow[];
  locations: MonthlyLocationIncomeRow[];
  previousDays: MonthlyDailyIncomeRow[];
  products: MonthlyProductSalesRow[];
}) {
  const income = totalIncome(currentDays);
  const previousIncome = totalIncome(previousDays);
  const daysWithClosing = currentDays.filter((day) => day.closed_shift_count > 0);
  const bestDay = daysWithClosing.reduce<MonthlyDailyIncomeRow | null>(
    (best, day) => !best || day.total_income > best.total_income ? day : best,
    null,
  );
  const lowestDay = daysWithClosing.reduce<MonthlyDailyIncomeRow | null>(
    (lowest, day) => !lowest || day.total_income < lowest.total_income ? day : lowest,
    null,
  );

  return {
    averageIncome: daysWithClosing.length > 0 ? income / daysWithClosing.length : 0,
    bestDay,
    cash: currentDays.reduce((total, day) => total + day.cash_amount, 0),
    daysWithClosing: daysWithClosing.length,
    income,
    locations: [...locations].sort((left, right) => right.total_income - left.total_income),
    lowestDay,
    noOperationDays: currentDays.filter(
      (day) => day.closed_shift_count === 0 && day.open_shift_count === 0,
    ).length,
    pendingDays: currentDays.filter((day) => day.open_shift_count > 0).length,
    products: [...products].sort(
      (left, right) => right.calculated_sales - left.calculated_sales,
    ),
    variationPercent: previousIncome > 0
      ? ((income - previousIncome) / previousIncome) * 100
      : null,
    yape: currentDays.reduce((total, day) => total + day.yape_amount, 0),
    zeroIncomeDays: daysWithClosing.filter((day) => day.total_income === 0).length,
  };
}

export function summarizeMonthlyBusiness({
  currentDays,
  currentMonth,
  currentLimaMonth,
  locations,
  previousDays,
  products,
}: {
  currentDays: MonthlyDailyIncomeRow[];
  currentMonth: string;
  currentLimaMonth: string;
  locations: MonthlyLocationIncomeRow[];
  previousDays: MonthlyDailyIncomeRow[];
  products: MonthlyProductSalesRow[];
}) {
  const comparablePreviousDays = currentMonth === currentLimaMonth
    ? previousDays.slice(0, currentDays.length)
    : previousDays;
  return summarizeBusinessPeriod({
    currentDays,
    locations,
    previousDays: comparablePreviousDays,
    products,
  });
}
