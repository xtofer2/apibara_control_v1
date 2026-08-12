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

export type ReportFilters = z.infer<typeof reportFilterSchema>;
