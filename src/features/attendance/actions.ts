"use server";

import { revalidatePath } from "next/cache";

import type { AttendanceActionState } from "@/features/attendance/action-state";
import { checkInSchema } from "@/features/attendance/schemas/attendance";
import {
  AttendanceServiceError,
  checkIn,
  checkOut,
} from "@/features/attendance/server/attendance-service";
import { requirePermission } from "@/features/auth/server/require-permission";

function operationError(error: unknown): AttendanceActionState {
  if (error instanceof AttendanceServiceError) {
    return { status: "error", message: error.message };
  }

  return {
    status: "error",
    message: "Ocurrió un error inesperado. Intenta nuevamente.",
  };
}

export async function checkInAction(
  _previousState: AttendanceActionState,
  formData: FormData,
): Promise<AttendanceActionState> {
  void _previousState;
  await requirePermission("attendance.operate");
  const parsed = checkInSchema.safeParse({
    location_id: formData.get("location_id"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Selecciona una sede para registrar tu entrada.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await checkIn(parsed.data.location_id);
  } catch (error) {
    return operationError(error);
  }

  revalidatePath("/dashboard/attendance");
  return { status: "success", message: "Entrada registrada correctamente." };
}

export async function checkOutAction(
  _previousState: AttendanceActionState,
  _formData: FormData,
): Promise<AttendanceActionState> {
  void _previousState;
  void _formData;
  await requirePermission("attendance.operate");

  try {
    await checkOut();
  } catch (error) {
    return operationError(error);
  }

  revalidatePath("/dashboard/attendance");
  return { status: "success", message: "Salida registrada correctamente." };
}
