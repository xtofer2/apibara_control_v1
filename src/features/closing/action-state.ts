export type ClosingActionState = {
  status: "idle" | "success" | "error";
  feedbackAt?: number;
  feedbackId?: string;
  message?: string;
};

export const initialClosingActionState: ClosingActionState = { status: "idle" };
