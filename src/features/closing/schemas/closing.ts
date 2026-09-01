import { z } from "zod";

const quantity = z.string().trim()
  .regex(/^\d+(?:\.\d{1,3})?$/, "Cantidad inválida.")
  .transform(Number);

const money = z.string().trim()
  .regex(/^\d+(?:\.\d{1,2})?$/, "Monto inválido.")
  .transform(Number);

export const closeShiftSchema = z.object({
  work_shift_id: z.uuid(),
  operational_date: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha válida.")
      .optional(),
  ),
  items: z.array(z.object({ product_id: z.uuid(), quantity })).min(1),
  payments: z.tuple([
    z.object({ code: z.literal("CASH"), amount: money }),
    z.object({ code: z.literal("YAPE"), amount: money }),
  ]),
});

export type CloseShiftInput = z.infer<typeof closeShiftSchema>;
