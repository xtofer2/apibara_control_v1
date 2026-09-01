import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import type { CloseShiftInput } from "@/features/closing/schemas/closing";
import type { ClosingHistoryRow, ClosingOpenShift, ClosingProduct } from "@/features/closing/types";
import { createClient } from "@/lib/supabase/server";

import { executeCloseShift, findClosingHistory, findClosingOpenShifts, findClosingProducts } from "./closing-repository";

export class ClosingServiceError extends Error {
  constructor(message: string) { super(message); this.name = "ClosingServiceError"; }
}

function toClosingError(error: PostgrestError) {
  const messages: Record<string, string> = {
    CLOSING_FORBIDDEN: "Tu cuenta no puede cerrar turnos.",
    CLOSING_SHIFT_NOT_OPEN: "El turno ya está cerrado o no existe.",
    CLOSING_OPENING_REQUIRED: "El turno requiere una apertura antes de cerrarse.",
    CLOSING_INVALID_ITEMS: "Registra el conteo final completo.",
    CLOSING_INVALID_QUANTITY: "Las cantidades finales no son válidas.",
    CLOSING_UNIT_QUANTITY_REQUIRED: "Los productos por unidad requieren cantidades enteras.",
    CLOSING_PRODUCT_SET_MISMATCH: "El catálogo cambió. Actualiza la página antes de cerrar.",
    CLOSING_INVALID_PAYMENTS: "Registra montos válidos para efectivo y Yape.",
    CLOSING_PAYMENT_METHOD_UNAVAILABLE: "Efectivo o Yape no están disponibles.",
    CLOSING_ALREADY_RECORDED: "El turno ya tiene un cierre registrado.",
    CLOSING_DATE_ALREADY_RECORDED: "La sede ya tiene un turno registrado en la fecha operativa seleccionada.",
    CLOSING_DATE_FORBIDDEN: "Solo un administrador puede seleccionar la fecha operativa del cierre.",
    CLOSING_INVALID_DATE: "La fecha operativa del cierre no es válida ni puede estar en el futuro.",
  };
  return new ClosingServiceError(messages[error.message] ?? "No se pudo cerrar el turno.");
}

export async function getClosingDashboard() {
  const supabase = await createClient();
  const [shiftsResult, productsResult, historyResult] = await Promise.all([
    findClosingOpenShifts(supabase), findClosingProducts(supabase), findClosingHistory(supabase),
  ]);
  const error = shiftsResult.error ?? productsResult.error ?? historyResult.error;
  if (error) throw toClosingError(error);
  return {
    openShifts: (shiftsResult.data ?? []) as ClosingOpenShift[],
    products: (productsResult.data ?? []) as ClosingProduct[],
    closings: (historyResult.data ?? []) as ClosingHistoryRow[],
  };
}

export async function closeShift(input: CloseShiftInput) {
  const supabase = await createClient();
  const { error } = await executeCloseShift(supabase, input);
  if (error) throw toClosingError(error);
}
