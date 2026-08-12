import type { Database } from "@/types/database.generated";

export type ShiftLocation = Pick<
  Database["public"]["Tables"]["locations"]["Row"],
  "id" | "name" | "code"
>;

export type ShiftProduct = Pick<
  Database["public"]["Tables"]["products"]["Row"],
  "id" | "name" | "code" | "unit_type" | "display_order"
>;

export type OpenShiftSummary = Pick<
  Database["public"]["Tables"]["work_shifts"]["Row"],
  "id" | "location_id" | "operational_date" | "opened_at" | "status"
> & {
  opening: {
    id: string;
    cash_opening: number;
    created_at: string;
    items: Array<{ product_id: string; quantity: number }>;
  } | null;
};
