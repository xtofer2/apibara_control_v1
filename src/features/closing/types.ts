import type { Database } from "@/types/database.generated";

export type ClosingProduct = Pick<Database["public"]["Tables"]["products"]["Row"],
  "id" | "name" | "code" | "unit_type" | "display_order">;

export type ClosingOpenShift = Pick<Database["public"]["Tables"]["work_shifts"]["Row"],
  "id" | "location_id" | "opened_at" | "operational_date"> & {
  location: { id: string; name: string; code: string } | null;
};

export type ClosingHistoryRow = Pick<Database["public"]["Tables"]["closings"]["Row"],
  "id" | "work_shift_id" | "created_by" | "created_at"> & {
  creator: { full_name: string } | null;
  shift: {
    closed_at: string | null;
    location: { name: string; code: string } | null;
    operational_date: string;
  } | null;
  items: Array<{ product_id: string; quantity: number }>;
  payments: Array<{ amount: number; method: { code: string; name: string } | null }>;
};
