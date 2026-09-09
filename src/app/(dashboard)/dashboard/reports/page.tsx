import { BarChart3, CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { requirePermission } from "@/features/auth/server/require-permission";
import { getLimaDate } from "@/features/attendance/lib/date-time";
import { DailyReconciliationReport } from "@/features/reports/components/daily-reconciliation-report";
import { BusinessPeriodReport } from "@/features/reports/components/monthly-business-report";
import {
  getMonthIntervals,
  getWeekIntervals,
  type BusinessReportView,
} from "@/features/reports/lib/report-period";
import {
  monthlyReportFilterSchema,
  periodSelectionSchema,
  reportFilterSchema,
  reportViewSchema,
  type ReportFilters,
} from "@/features/reports/schemas/report";
import {
  getAdminPeriodBusinessReport,
  getManagementReport,
} from "@/features/reports/server/report-service";

export const metadata: Metadata = { title: "Reportes" };

type ReportsPageProps = {
  searchParams: Promise<{
    date?: string | string[];
    location_id?: string | string[];
    month?: string | string[];
    period_location_id?: string | string[];
    user_id?: string | string[];
    view?: string | string[];
    week?: string | string[];
  }>;
};

function singleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const profile = await requirePermission("reports.read");
  const raw = await searchParams;
  const today = getLimaDate();
  const currentMonth = today.slice(0, 7);
  const requestedView = reportViewSchema.safeParse(singleValue(raw.view));
  const defaultView: BusinessReportView = profile.role === "ADMIN" ? "month" : "day";
  const view: BusinessReportView = requestedView.success
    && (profile.role === "ADMIN" || requestedView.data === "day")
    ? requestedView.data
    : defaultView;

  const parsedDailyFilters = reportFilterSchema.safeParse({
    date: singleValue(raw.date) ?? today,
    location_id: singleValue(raw.location_id),
    user_id: singleValue(raw.user_id),
  });
  const dailyFiltersAreValid = parsedDailyFilters.success
    && parsedDailyFilters.data.date <= today;
  const dailyFilters: ReportFilters = dailyFiltersAreValid
    ? parsedDailyFilters.data
    : { date: today, location_id: undefined, user_id: undefined };

  const parsedWeekSelection = periodSelectionSchema.safeParse({
    period_location_id: singleValue(raw.period_location_id),
    week: singleValue(raw.week) ?? today,
  });
  const weekSelectionIsValid = parsedWeekSelection.success
    && parsedWeekSelection.data.week <= today;
  const selectedWeek = weekSelectionIsValid ? parsedWeekSelection.data.week : today;

  const parsedMonthSelection = monthlyReportFilterSchema.safeParse({
    month: singleValue(raw.month) ?? currentMonth,
    monthly_location_id: singleValue(raw.period_location_id),
  });
  const monthSelectionIsValid = parsedMonthSelection.success
    && parsedMonthSelection.data.month <= currentMonth;
  const selectedMonth = monthSelectionIsValid ? parsedMonthSelection.data.month : currentMonth;
  const periodLocationId = view === "week"
    ? (weekSelectionIsValid ? parsedWeekSelection.data.period_location_id : undefined)
    : (monthSelectionIsValid ? parsedMonthSelection.data.monthly_location_id : undefined);
  const periodFiltersAreValid = view === "week" ? weekSelectionIsValid : monthSelectionIsValid;
  const interval = view === "week"
    ? getWeekIntervals(selectedWeek, today)
    : getMonthIntervals(selectedMonth, today);

  const dailyReport = view === "day" ? await getManagementReport(dailyFilters) : null;
  const periodReport = view !== "day"
    ? await getAdminPeriodBusinessReport(
        { from: interval.current.from, location_id: periodLocationId, to: interval.current.to },
        { from: interval.previous.from, location_id: periodLocationId, to: interval.previous.to },
      )
    : null;

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
          <BarChart3 aria-hidden="true" className="size-4" /> Inteligencia y conciliación
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">Centro de reportes</h1>
        <p className="mt-3 max-w-3xl leading-7 text-stone-600">Analiza ingresos, cierres y ventas calculadas con el nivel de detalle que necesitas para tomar decisiones.</p>
      </section>

      <ReportViewSelector currentMonth={currentMonth} isAdmin={profile.role === "ADMIN"} today={today} view={view} />

      {view === "day" && dailyReport ? (
        <DailyReconciliationReport currentLimaDate={today} filters={dailyFilters} filtersAreValid={dailyFiltersAreValid} report={dailyReport} />
      ) : null}

      {view !== "day" && periodReport ? (
        <>
          <BusinessPeriodReport
            currentLimaDate={today}
            interval={interval.current}
            locationId={periodLocationId}
            locations={periodReport.availableLocations}
            mode={view}
            report={periodReport}
            selectedMonth={selectedMonth}
            selectedWeek={interval.current.from}
          />
          {!periodFiltersAreValid ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">El periodo o local recibido no era válido y el análisis se restableció al periodo actual.</p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function ReportViewSelector({ currentMonth, isAdmin, today, view }: { currentMonth: string; isAdmin: boolean; today: string; view: BusinessReportView }) {
  const options: { href: string; label: string; value: BusinessReportView }[] = [
    { href: `?view=day&date=${today}`, label: "Diario", value: "day" },
    ...(isAdmin ? [
      { href: `?view=week&week=${today}`, label: "Semanal", value: "week" as const },
      { href: `?view=month&month=${currentMonth}`, label: "Mensual", value: "month" as const },
    ] : []),
  ];

  return (
    <nav aria-label="Nivel de detalle del reporte" className="rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
      <div className={`grid gap-2 ${isAdmin ? "grid-cols-3" : "grid-cols-1"}`}>
        {options.map((option) => {
          const active = option.value === view;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors ${active ? "bg-stone-950 text-white" : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"}`}
              href={option.href}
              key={option.value}
            >
              <CalendarDays aria-hidden="true" className={`size-4 ${active ? "text-orange-400" : "text-stone-400"}`} /> {option.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
