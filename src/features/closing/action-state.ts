export type ClosingActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialClosingActionState: ClosingActionState = { status: "idle" };
