"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/features/auth/server/require-permission";
import type { ClosingActionState } from "@/features/closing/action-state";
import { closeShiftSchema } from "@/features/closing/schemas/closing";
import { closeShift, ClosingServiceError } from "@/features/closing/server/closing-service";

export async function closeShiftAction(
  _previousState: ClosingActionState,
  formData: FormData,
): Promise<ClosingActionState> {
  void _previousState;
  await requirePermission("closing.operate");
  const items = Array.from(formData.entries())
    .filter(([name]) => name.startsWith("closing."))
    .map(([name, quantity]) => ({ product_id: name.slice("closing.".length), quantity }));
  const parsed = closeShiftSchema.safeParse({
    work_shift_id: formData.get("work_shift_id"),
    items,
    payments: [
      { code: "CASH", amount: formData.get("cash_amount") },
      { code: "YAPE", amount: formData.get("yape_amount") },
    ],
  });
  if (!parsed.success) return { status: "error", message: "Revisa el conteo final y los montos de efectivo y Yape." };

  try { await closeShift(parsed.data); }
  catch (error) {
    return { status: "error", message: error instanceof ClosingServiceError ? error.message : "Ocurrió un error inesperado." };
  }
  revalidatePath("/dashboard/closing");
  revalidatePath("/dashboard/shift");
  return { status: "success", message: "Turno cerrado correctamente." };
}
