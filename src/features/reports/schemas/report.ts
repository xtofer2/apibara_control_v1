import { z } from "zod";

const optionalUuid = z.preprocess(
  (value) => value === "" || value == null ? undefined : value,
  z.uuid().optional(),
);

const dateValue = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(
  (value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  },
  "Fecha inválida",
);

const monthValue = z.string().regex(/^\d{4}-\d{2}$/).refine(
  (value) => {
    const date = new Date(`${value}-01T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 7) === value;
  },
  "Mes inválido",
);

export const reportFilterSchema = z.object({
  date: dateValue,
  location_id: optionalUuid,
  user_id: optionalUuid,
});

export const monthlyReportFilterSchema = z.object({
  month: monthValue,
  monthly_location_id: optionalUuid,
});

export const reportViewSchema = z.enum(["day", "week", "month"]);

export const periodSelectionSchema = z.object({
  period_location_id: optionalUuid,
  week: dateValue,
});

export const periodReportFilterSchema = z.object({
  from: dateValue,
  location_id: optionalUuid,
  to: dateValue,
});

export type ReportFilters = z.infer<typeof reportFilterSchema>;
export type MonthlyReportFilters = z.infer<typeof monthlyReportFilterSchema>;
export type PeriodReportFilters = z.infer<typeof periodReportFilterSchema>;
