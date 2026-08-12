import type { Database } from "@/types/database.generated";

export type InventoryMovementType =
  Database["public"]["Enums"]["inventory_movement_type"];

export type InventoryProduct = Pick<
  Database["public"]["Tables"]["products"]["Row"],
  "id" | "name" | "code" | "unit_type" | "display_order"
>;

export type InventoryOpenShift = Pick<
  Database["public"]["Tables"]["work_shifts"]["Row"],
  "id" | "location_id" | "operational_date" | "opened_at"
> & { location: { id: string; name: string; code: string } | null };

export type InventoryMovementHistory = Pick<
  Database["public"]["Tables"]["inventory_movements"]["Row"],
  "id" | "work_shift_id" | "movement_type" | "reason" | "notes" | "created_by" | "created_at"
> & {
  creator: { full_name: string } | null;
  shift: { location: { name: string; code: string } | null } | null;
  items: Array<{ product_id: string; quantity: number }>;
};
