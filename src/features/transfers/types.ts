import type { Database } from "@/types/database.generated";

export type TransferProduct = Pick<Database["public"]["Tables"]["products"]["Row"],
  "id" | "name" | "code" | "unit_type" | "display_order">;

export type TransferLocation = Pick<Database["public"]["Tables"]["locations"]["Row"],
  "id" | "name" | "code">;

export type TransferOpenShift = Pick<Database["public"]["Tables"]["work_shifts"]["Row"],
  "id" | "location_id" | "opened_at"> & {
  location: TransferLocation | null;
};

export type TransferHistoryRow = Pick<Database["public"]["Tables"]["transfers"]["Row"],
  "id" | "origin_location_id" | "destination_location_id" | "destination_work_shift_id" |
  "status" | "sent_at" | "received_at" | "reception_notes" | "created_by"> & {
  origin: TransferLocation | null;
  destination: TransferLocation | null;
  creator: { full_name: string } | null;
  receiver: { full_name: string } | null;
  items: Array<{ product_id: string; sent_quantity: number; received_quantity: number | null }>;
};
