import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import type { OpenShiftInput } from "@/features/shifts/schemas/shift";
import type {
  OpenShiftSummary,
  ShiftLocation,
  ShiftProduct,
} from "@/features/shifts/types";
import { createClient } from "@/lib/supabase/server";

import {
  executeOpenShift,
  findActiveShiftLocations,
  findActiveShiftProducts,
  findCurrentOpenShifts,
} from "./shift-repository";

export class ShiftServiceError extends Error {
  constructor(
    public readonly code:
      | "ALREADY_OPEN"
      | "ALREADY_RECORDED"
      | "LOCATION_UNAVAILABLE"
      | "INVALID_OPENING"
      | "INVALID_DATE"
      | "FORBIDDEN"
      | "UNKNOWN",
    message: string,
  ) {
    super(message);
    this.name = "ShiftServiceError";
  }
}

function toShiftServiceError(error: PostgrestError) {
  const messages: Record<
    string,
    { code: ShiftServiceError["code"]; message: string }
  > = {
    SHIFT_ALREADY_OPEN: {
      code: "ALREADY_OPEN",
      message: "La sede ya tiene un turno operativo abierto.",
    },
    SHIFT_ALREADY_RECORDED: {
      code: "ALREADY_RECORDED",
      message: "La sede ya tuvo un turno durante esta fecha operativa.",
    },
    SHIFT_LOCATION_UNAVAILABLE: {
      code: "LOCATION_UNAVAILABLE",
      message: "La sede seleccionada no está disponible.",
    },
    SHIFT_FORBIDDEN: {
      code: "FORBIDDEN",
      message: "Tu cuenta no puede abrir turnos operativos.",
    },
    SHIFT_INVALID_CASH: {
      code: "INVALID_OPENING",
      message: "El efectivo inicial no es válido.",
    },
    SHIFT_INVALID_DATE: {
      code: "INVALID_DATE",
      message: "La fecha operativa seleccionada no es válida.",
    },
    SHIFT_DATE_FORBIDDEN: {
      code: "FORBIDDEN",
      message: "Solo un administrador puede seleccionar la fecha operativa.",
    },
    SHIFT_INVALID_ITEMS: {
      code: "INVALID_OPENING",
      message: "El conteo de apertura no es válido.",
    },
    SHIFT_INVALID_QUANTITY: {
      code: "INVALID_OPENING",
      message: "Una cantidad de apertura no es válida.",
    },
    SHIFT_UNIT_QUANTITY_REQUIRED: {
      code: "INVALID_OPENING",
      message: "Los productos por unidad requieren cantidades enteras.",
    },
    SHIFT_PRODUCT_SET_MISMATCH: {
      code: "INVALID_OPENING",
      message: "El catálogo cambió. Actualiza la página antes de confirmar.",
    },
  };
  const knownError = messages[error.message];

  if (knownError) {
    return new ShiftServiceError(knownError.code, knownError.message);
  }

  return new ShiftServiceError(
    "UNKNOWN",
    "No se pudo registrar la apertura del turno.",
  );
}

export async function getShiftDashboard() {
  const supabase = await createClient();
  const [locationsResult, productsResult, shiftsResult] = await Promise.all([
    findActiveShiftLocations(supabase),
    findActiveShiftProducts(supabase),
    findCurrentOpenShifts(supabase),
  ]);
  const error =
    locationsResult.error ?? productsResult.error ?? shiftsResult.error;

  if (error) {
    throw toShiftServiceError(error);
  }

  return {
    locations: (locationsResult.data ?? []) as ShiftLocation[],
    products: (productsResult.data ?? []) as ShiftProduct[],
    openShifts: (shiftsResult.data ?? []) as OpenShiftSummary[],
  };
}

export async function openShift(input: OpenShiftInput) {
  const supabase = await createClient();
  const { error } = await executeOpenShift(supabase, input);

  if (error) {
    throw toShiftServiceError(error);
  }
}
