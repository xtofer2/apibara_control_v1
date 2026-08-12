"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/features/auth/server/require-permission";
import type { InventoryActionState } from "@/features/inventory/action-state";
import { inventoryMovementSchema } from "@/features/inventory/schemas/inventory-movement";
import {
  createInventoryMovement,
  InventoryServiceError,
} from "@/features/inventory/server/inventory-service";

export async function createInventoryMovementAction(
  _previousState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  void _previousState;
  await requirePermission("inventory.entry");

  const items = Array.from(formData.entries())
    .filter(([name, value]) => name.startsWith("quantity.") && String(value).trim() !== "")
    .map(([name, quantity]) => ({
      product_id: name.slice("quantity.".length),
      quantity,
    }));
  const parsed = inventoryMovementSchema.safeParse({
    work_shift_id: formData.get("work_shift_id"),
    movement_type: formData.get("movement_type"),
    reason: formData.get("reason") || undefined,
    notes: formData.get("notes") || undefined,
    items,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa el tipo, los detalles y las cantidades del movimiento.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.movement_type.startsWith("ADJUSTMENT_")) {
    await requirePermission("inventory.adjustment");
  } else if (parsed.data.movement_type === "WASTE") {
    await requirePermission("inventory.waste");
  }

  try {
    await createInventoryMovement(parsed.data);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof InventoryServiceError
        ? error.message
        : "Ocurrió un error inesperado. Intenta nuevamente.",
    };
  }

  revalidatePath("/dashboard/inventory");
  return { status: "success", message: "Movimiento registrado correctamente." };
}
