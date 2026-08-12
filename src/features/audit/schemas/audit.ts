import { z } from "zod";

const optionalText = z.preprocess(
  (value) => value === "" || value == null ? undefined : value,
  z.string().trim().min(1).max(80).optional(),
);

const optionalUuid = z.preprocess(
  (value) => value === "" || value == null ? undefined : value,
  z.uuid().optional(),
);

export const auditFilterSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  action: optionalText,
  user_id: optionalUuid,
});

export type AuditFilters = z.infer<typeof auditFilterSchema>;
