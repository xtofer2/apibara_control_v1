import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import type { InventoryMovementInput } from "@/features/inventory/schemas/inventory-movement";
import type {
  InventoryMovementHistory,
  InventoryOpenShift,
  InventoryProduct,
} from "@/features/inventory/types";
import { createClient } from "@/lib/supabase/server";

import {
  executeInventoryMovement,
  findInventoryOpenShifts,
  findInventoryProducts,
  findRecentInventoryMovements,
} from "./inventory-repository";

export class InventoryServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InventoryServiceError";
  }
}

function toInventoryError(error: PostgrestError) {
  const messages: Record<string, string> = {
    INVENTORY_FORBIDDEN: "Tu cuenta no puede registrar movimientos.",
    INVENTORY_ADJUSTMENT_FORBIDDEN: "Solo gerencia puede registrar ajustes de inventario.",
    INVENTORY_SHIFT_NOT_OPEN: "El turno seleccionado ya no está abierto.",
    INVENTORY_OPENING_REQUIRED: "El turno necesita una apertura antes de registrar movimientos.",
    INVENTORY_WASTE_REASON_REQUIRED: "Selecciona un motivo válido para la merma.",
    INVENTORY_OTHER_NOTES_REQUIRED: "Describe el motivo de la merma.",
    INVENTORY_ADJUSTMENT_DETAILS_REQUIRED: "Los ajustes requieren motivo y observación.",
    INVENTORY_INVALID_ITEMS: "Registra al menos un producto sin duplicados.",
    INVENTORY_INVALID_QUANTITY: "Las cantidades deben ser positivas y tener hasta tres decimales.",
    INVENTORY_PRODUCT_UNAVAILABLE: "Uno de los productos ya no está disponible.",
    INVENTORY_UNIT_QUANTITY_REQUIRED: "Los productos por unidad requieren cantidades enteras.",
  };

  return new InventoryServiceError(
    messages[error.message] ?? "No se pudo registrar el movimiento de inventario.",
  );
}

export async function getInventoryDashboard() {
  const supabase = await createClient();
  const [shiftsResult, productsResult, movementsResult] = await Promise.all([
    findInventoryOpenShifts(supabase),
    findInventoryProducts(supabase),
    findRecentInventoryMovements(supabase),
  ]);
  const error = shiftsResult.error ?? productsResult.error ?? movementsResult.error;

  if (error) throw toInventoryError(error);

  return {
    openShifts: (shiftsResult.data ?? []) as InventoryOpenShift[],
    products: (productsResult.data ?? []) as InventoryProduct[],
    movements: (movementsResult.data ?? []) as InventoryMovementHistory[],
  };
}

export async function createInventoryMovement(input: InventoryMovementInput) {
  const supabase = await createClient();
  const { error } = await executeInventoryMovement(supabase, input);
  if (error) throw toInventoryError(error);
}
