export type CatalogActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialCatalogActionState: CatalogActionState = {
  status: "idle",
};
