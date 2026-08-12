export type ShiftActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialShiftActionState: ShiftActionState = {
  status: "idle",
};
