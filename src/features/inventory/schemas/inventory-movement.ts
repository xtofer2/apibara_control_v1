import { z } from "zod";

export const inventoryMovementTypes = [
  "ENTRY",
  "WASTE",
  "ADJUSTMENT_POSITIVE",
  "ADJUSTMENT_NEGATIVE",
] as const;

export const wasteReasons = [
  "DAMAGED",
  "DROPPED",
  "PREPARATION",
  "EXPIRED",
  "OTHER",
] as const;

const quantitySchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,3})?$/, "Ingresa una cantidad válida.")
  .transform(Number)
  .refine((value) => value > 0, "La cantidad debe ser mayor que cero.");

export const inventoryMovementSchema = z
  .object({
    work_shift_id: z.uuid("Selecciona un turno válido."),
    movement_type: z.enum(inventoryMovementTypes),
    reason: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(500).optional(),
    items: z
      .array(
        z.object({
          product_id: z.uuid(),
          quantity: quantitySchema,
        }),
      )
      .min(1, "Registra al menos un producto."),
  })
  .superRefine((input, context) => {
    if (new Set(input.items.map((item) => item.product_id)).size !== input.items.length) {
      context.addIssue({ code: "custom", path: ["items"], message: "Hay productos duplicados." });
    }

    if (input.movement_type === "WASTE") {
      if (!wasteReasons.includes(input.reason as (typeof wasteReasons)[number])) {
        context.addIssue({ code: "custom", path: ["reason"], message: "Selecciona el motivo de la merma." });
      }
      if (input.reason === "OTHER" && !input.notes) {
        context.addIssue({ code: "custom", path: ["notes"], message: "Describe el motivo de la merma." });
      }
    }

    if (input.movement_type.startsWith("ADJUSTMENT_") && (!input.reason || !input.notes)) {
      context.addIssue({ code: "custom", path: ["notes"], message: "Los ajustes requieren motivo y observación." });
    }
  });

export type InventoryMovementInput = z.infer<typeof inventoryMovementSchema>;
