import type { Database } from "@/types/database.generated";

type ShiftStatus = Database["public"]["Enums"]["shift_status"];

export function canTransitionShift(from: ShiftStatus, to: ShiftStatus) {
  return from === "OPEN" && to === "CLOSED";
}
