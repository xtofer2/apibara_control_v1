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

export type CheckInInput = z.infer<typeof checkInSchema>;
export type AttendanceReportFilters = z.infer<
  typeof attendanceReportFilterSchema
>;
