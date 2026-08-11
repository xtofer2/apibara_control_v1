import { z } from "zod";

const catalogCodeSchema = z
  .string()
  .trim()
  .min(2, "El código debe tener al menos 2 caracteres.")
  .max(40, "El código no puede superar 40 caracteres.")
  .transform((value) => value.toUpperCase())
  .pipe(
    z.string().regex(
      /^[A-Z0-9_]+$/,
      "Usa únicamente letras, números y guiones bajos.",
    ),
  );

const catalogNameSchema = z
  .string()
  .trim()
  .min(2, "El nombre debe tener al menos 2 caracteres.")
  .max(100, "El nombre no puede superar 100 caracteres.");

export const locationCatalogSchema = z.object({
  name: catalogNameSchema,
  code: catalogCodeSchema,
  active: z.boolean(),
});

export const productCatalogSchema = z.object({
  name: catalogNameSchema,
  code: catalogCodeSchema,
  unit_type: z.enum(["UNIT", "LITER"], {
    error: "Selecciona una unidad válida.",
  }),
  display_order: z.coerce
    .number()
    .int("El orden debe ser un número entero.")
    .min(0, "El orden no puede ser negativo."),
  active: z.boolean(),
});

export type LocationCatalogInput = z.infer<typeof locationCatalogSchema>;
export type ProductCatalogInput = z.infer<typeof productCatalogSchema>;
