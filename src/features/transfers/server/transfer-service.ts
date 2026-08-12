import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import type { ReceiveTransferInput, SendTransferInput } from "@/features/transfers/schemas/transfer";
import type { TransferHistoryRow, TransferLocation, TransferOpenShift, TransferProduct } from "@/features/transfers/types";
import { createClient } from "@/lib/supabase/server";

import {
  executeReceiveTransfer,
  executeSendTransfer,
  findTransferHistory,
  findTransferLocations,
  findTransferOpenShifts,
  findTransferProducts,
} from "./transfer-repository";

export class TransferServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransferServiceError";
  }
}

function toTransferError(error: PostgrestError) {
  const messages: Record<string, string> = {
    TRANSFER_FORBIDDEN: "Tu cuenta no puede operar transferencias.",
    TRANSFER_ORIGIN_SHIFT_NOT_OPEN: "El turno de origen ya no está abierto.",
    TRANSFER_ORIGIN_OPENING_REQUIRED: "El turno de origen requiere una apertura.",
    TRANSFER_SAME_LOCATION: "La sede de destino debe ser diferente del origen.",
    TRANSFER_DESTINATION_UNAVAILABLE: "La sede de destino no está disponible.",
    TRANSFER_INVALID_ITEMS: "Registra al menos un producto sin duplicados.",
    TRANSFER_INVALID_QUANTITY: "Las cantidades enviadas deben ser positivas.",
    TRANSFER_PRODUCT_UNAVAILABLE: "Uno de los productos ya no está disponible.",
    TRANSFER_UNIT_QUANTITY_REQUIRED: "Los productos por unidad requieren cantidades enteras.",
    TRANSFER_NOT_FOUND: "La transferencia no existe.",
    TRANSFER_NOT_RECEIVABLE: "La transferencia ya fue recibida o no puede recibirse.",
    TRANSFER_DESTINATION_SHIFT_NOT_OPEN: "Selecciona un turno abierto de la sede destino.",
    TRANSFER_DESTINATION_OPENING_REQUIRED: "El turno destino requiere una apertura.",
    TRANSFER_INVALID_RECEIPT: "Registra todas las cantidades recibidas.",
    TRANSFER_RECEIPT_ITEM_MISMATCH: "Los productos recibidos no coinciden con el envío.",
    TRANSFER_INVALID_RECEIVED_QUANTITY: "Las cantidades recibidas no son válidas.",
    TRANSFER_DIFFERENCE_NOTES_REQUIRED: "Describe las diferencias encontradas en la recepción.",
  };
  return new TransferServiceError(messages[error.message] ?? "No se pudo completar la transferencia.");
}

export async function getTransferDashboard() {
  const supabase = await createClient();
  const [locationsResult, productsResult, shiftsResult, historyResult] = await Promise.all([
    findTransferLocations(supabase),
    findTransferProducts(supabase),
    findTransferOpenShifts(supabase),
    findTransferHistory(supabase),
  ]);
  const error = locationsResult.error ?? productsResult.error ?? shiftsResult.error ?? historyResult.error;
  if (error) throw toTransferError(error);

  return {
    locations: (locationsResult.data ?? []) as TransferLocation[],
    products: (productsResult.data ?? []) as TransferProduct[],
    openShifts: (shiftsResult.data ?? []) as TransferOpenShift[],
    transfers: (historyResult.data ?? []) as TransferHistoryRow[],
  };
}

export async function sendTransfer(input: SendTransferInput) {
  const supabase = await createClient();
  const { error } = await executeSendTransfer(supabase, input);
  if (error) throw toTransferError(error);
}

export async function receiveTransfer(input: ReceiveTransferInput) {
  const supabase = await createClient();
  const { error } = await executeReceiveTransfer(supabase, input);
  if (error) throw toTransferError(error);
}
