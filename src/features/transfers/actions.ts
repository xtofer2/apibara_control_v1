"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/features/auth/server/require-permission";
import type { TransferActionState } from "@/features/transfers/action-state";
import { receiveTransferSchema, sendTransferSchema } from "@/features/transfers/schemas/transfer";
import {
  receiveTransfer,
  sendTransfer,
  TransferServiceError,
} from "@/features/transfers/server/transfer-service";

function itemsFromForm(formData: FormData, prefix: string, includeEmpty: boolean) {
  return Array.from(formData.entries())
    .filter(([name, value]) => name.startsWith(prefix) && (includeEmpty || String(value).trim() !== ""))
    .map(([name, quantity]) => ({ product_id: name.slice(prefix.length), quantity }));
}

function actionError(error: unknown): TransferActionState {
  return {
    status: "error",
    message: error instanceof TransferServiceError
      ? error.message
      : "Ocurrió un error inesperado. Intenta nuevamente.",
  };
}

export async function sendTransferAction(
  _previousState: TransferActionState,
  formData: FormData,
): Promise<TransferActionState> {
  void _previousState;
  await requirePermission("transfers.operate");
  const parsed = sendTransferSchema.safeParse({
    origin_work_shift_id: formData.get("origin_work_shift_id"),
    destination_location_id: formData.get("destination_location_id"),
    items: itemsFromForm(formData, "sent.", false),
  });
  if (!parsed.success) return { status: "error", message: "Revisa el origen, destino y cantidades enviadas." };

  try {
    await sendTransfer(parsed.data);
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/dashboard/transfers");
  return { status: "success", message: "Transferencia enviada correctamente." };
}

export async function receiveTransferAction(
  _previousState: TransferActionState,
  formData: FormData,
): Promise<TransferActionState> {
  void _previousState;
  await requirePermission("transfers.operate");
  const parsed = receiveTransferSchema.safeParse({
    transfer_id: formData.get("transfer_id"),
    destination_work_shift_id: formData.get("destination_work_shift_id"),
    reception_notes: formData.get("reception_notes") || undefined,
    items: itemsFromForm(formData, "received.", true),
  });
  if (!parsed.success) return { status: "error", message: "Registra todas las cantidades recibidas y revisa la observación." };

  try {
    await receiveTransfer(parsed.data);
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/dashboard/transfers");
  return { status: "success", message: "Recepción confirmada correctamente." };
}
