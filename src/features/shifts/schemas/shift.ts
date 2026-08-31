import { z } from "zod";

const decimalQuantity = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,3})?$/, "Ingresa una cantidad válida.")
  .transform(Number);

export const openShiftSchema = z.object({
  location_id: z.uuid("Selecciona una sede válida."),
  operational_date: z
    .preprocess(
      (value) => (value === "" || value == null ? undefined : value),
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha válida.")
        .optional(),
    ),
  cash_opening: z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d{1,2})?$/, "Ingresa un monto válido.")
    .transform(Number),
  items: z
    .array(
      z.object({
        product_id: z.uuid(),
        quantity: decimalQuantity,
      }),
    )
    .min(1, "Registra el conteo de productos.")
    .superRefine((items, context) => {
      if (new Set(items.map((item) => item.product_id)).size !== items.length) {
        context.addIssue({
          code: "custom",
          message: "El conteo contiene productos duplicados.",
        });
      }
    }),
});

export type OpenShiftInput = z.infer<typeof openShiftSchema>;
