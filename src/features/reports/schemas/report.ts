import { z } from "zod";

const optionalUuid = z.preprocess(
  (value) => value === "" || value == null ? undefined : value,
  z.uuid().optional(),
);

export const reportFilterSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  location_id: optionalUuid,
  user_id: optionalUuid,
});

export const monthlyReportFilterSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  monthly_location_id: optionalUuid,
});

export type ReportFilters = z.infer<typeof reportFilterSchema>;
export type MonthlyReportFilters = z.infer<typeof monthlyReportFilterSchema>;
