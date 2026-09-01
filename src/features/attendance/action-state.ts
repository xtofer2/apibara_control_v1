export type AttendanceActionState = {
  status: "idle" | "success" | "error";
  feedbackAt?: number;
  feedbackId?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialAttendanceActionState: AttendanceActionState = {
  status: "idle",
};
