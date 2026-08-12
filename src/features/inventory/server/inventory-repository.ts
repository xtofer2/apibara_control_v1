import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { InventoryMovementInput } from "@/features/inventory/schemas/inventory-movement";
import type { Database, Json } from "@/types/database.generated";

type InventoryClient = SupabaseClient<Database>;

export function findInventoryOpenShifts(supabase: InventoryClient) {
  return supabase
    .from("work_shifts")
    .select("id, location_id, operational_date, opened_at, location:locations(id, name, code)")
    .eq("status", "OPEN")
    .order("opened_at", { ascending: false });
}

export function findInventoryProducts(supabase: InventoryClient) {
  return supabase
    .from("products")
    .select("id, name, code, unit_type, display_order")
    .eq("active", true)
    .order("display_order")
    .order("name");
}

export function findRecentInventoryMovements(supabase: InventoryClient) {
  return supabase
    .from("inventory_movements")
    .select(`
      id,
      work_shift_id,
      movement_type,
      reason,
      notes,
      created_by,
      created_at,
      creator:profiles(full_name),
      shift:work_shifts(location:locations(name, code)),
      items:inventory_movement_items(product_id, quantity)
    `)
    .order("created_at", { ascending: false })
    .limit(20);
}

export function executeInventoryMovement(
  supabase: InventoryClient,
  input: InventoryMovementInput,
) {
  return supabase.rpc("create_inventory_movement", {
    selected_items: input.items as Json,
    selected_movement_type: input.movement_type,
    selected_notes: input.notes || "",
    selected_reason: input.reason || "",
    selected_work_shift_id: input.work_shift_id,
  });
}
