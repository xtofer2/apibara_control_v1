import { z } from "zod";

const positiveQuantity = z.string().trim()
  .regex(/^\d+(?:\.\d{1,3})?$/, "Cantidad inválida.")
  .transform(Number)
  .refine((value) => value > 0, "La cantidad debe ser positiva.");

const receivedQuantity = z.string().trim()
  .regex(/^\d+(?:\.\d{1,3})?$/, "Cantidad inválida.")
  .transform(Number);

const uniqueItems = <T extends { product_id: string }>(items: T[]) =>
  new Set(items.map((item) => item.product_id)).size === items.length;

export const sendTransferSchema = z.object({
  origin_work_shift_id: z.uuid(),
  destination_location_id: z.uuid(),
  items: z.array(z.object({ product_id: z.uuid(), quantity: positiveQuantity })).min(1),
}).refine((input) => uniqueItems(input.items), { path: ["items"], message: "Hay productos duplicados." });

export const receiveTransferSchema = z.object({
  transfer_id: z.uuid(),
  destination_work_shift_id: z.uuid(),
  reception_notes: z.string().trim().max(500).optional(),
  items: z.array(z.object({ product_id: z.uuid(), quantity: receivedQuantity })).min(1),
}).refine((input) => uniqueItems(input.items), { path: ["items"], message: "Hay productos duplicados." });

export type SendTransferInput = z.infer<typeof sendTransferSchema>;
export type ReceiveTransferInput = z.infer<typeof receiveTransferSchema>;
