"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/features/auth/server/require-permission";
import type { ShiftActionState } from "@/features/shifts/action-state";
import { openShiftSchema } from "@/features/shifts/schemas/shift";
import {
  openShift,
  ShiftServiceError,
} from "@/features/shifts/server/shift-service";
import { createSuccessFeedback } from "@/lib/action-feedback";

export async function openShiftAction(
  _previousState: ShiftActionState,
  formData: FormData,
): Promise<ShiftActionState> {
  void _previousState;
  const profile = await requirePermission("shifts.operate");

  const items = Array.from(formData.entries())
    .filter(([name]) => name.startsWith("quantity."))
    .map(([name, quantity]) => ({
      product_id: name.slice("quantity.".length),
      quantity,
    }));
  const parsed = openShiftSchema.safeParse({
    location_id: formData.get("location_id"),
    operational_date: formData.get("operational_date"),
    cash_opening: formData.get("cash_opening"),
    items,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los datos de la apertura antes de confirmar.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.operational_date && profile.role !== "ADMIN") {
    return {
      status: "error",
      message: "Solo un administrador puede seleccionar la fecha operativa.",
    };
  }

  try {
    await openShift(parsed.data);
  } catch (error) {
    if (error instanceof ShiftServiceError) {
      return { status: "error", message: error.message };
    }

    return {
      status: "error",
      message: "Ocurrió un error inesperado. Intenta nuevamente.",
    };
  }

  revalidatePath("/dashboard/shift");
  revalidatePath("/dashboard");
  return createSuccessFeedback("Turno abierto correctamente.");
}
