export type InventoryActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialInventoryActionState: InventoryActionState = {
  status: "idle",
};
