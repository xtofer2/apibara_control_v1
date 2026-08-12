import type { InventoryMovementType } from "@/features/inventory/types";

export const movementLabels: Record<InventoryMovementType, string> = {
  ENTRY: "Entrada",
  WASTE: "Merma",
  ADJUSTMENT_POSITIVE: "Ajuste positivo",
  ADJUSTMENT_NEGATIVE: "Ajuste negativo",
};

export const wasteReasonLabels: Record<string, string> = {
  DAMAGED: "Producto dañado",
  DROPPED: "Caída o derrame",
  PREPARATION: "Pérdida en preparación",
  EXPIRED: "Producto vencido",
  OTHER: "Otro motivo",
};
