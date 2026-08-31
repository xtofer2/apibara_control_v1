import { z } from "zod";

export const checkInSchema = z.object({
  location_id: z.uuid("Selecciona una sede válida."),
});

const optionalUuid = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.uuid("El filtro seleccionado no es válido.").optional(),
);

export const attendanceReportFilterSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha no es válida."),
  location_id: optionalUuid,
  user_id: optionalUuid,
});

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha no es válida.");

export const attendancePeriodFilterSchema = z
  .object({
    period_user_id: optionalUuid,
    period_from: isoDate,
    period_to: isoDate,
  })
  .superRefine((value, context) => {
    if (value.period_to < value.period_from) {
      context.addIssue({
        code: "custom",
        message: "La fecha final debe ser igual o posterior a la inicial.",
        path: ["period_to"],
      });
      return;
    }

    const start = Date.parse(`${value.period_from}T00:00:00Z`);
    const end = Date.parse(`${value.period_to}T00:00:00Z`);
    const intervalDays = Math.round((end - start) / 86_400_000) + 1;

    if (intervalDays > 366) {
      context.addIssue({
        code: "custom",
        message: "El intervalo no puede superar 366 días.",
        path: ["period_to"],
      });
    }
  });

export type CheckInInput = z.infer<typeof checkInSchema>;
export type AttendanceReportFilters = z.infer<
  typeof attendanceReportFilterSchema
>;
export type AttendancePeriodFilters = z.infer<
  typeof attendancePeriodFilterSchema
>;
