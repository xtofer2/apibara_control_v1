export type AttendanceActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialAttendanceActionState: AttendanceActionState = {
  status: "idle",
};
