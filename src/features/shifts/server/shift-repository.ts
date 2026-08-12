import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { OpenShiftInput } from "@/features/shifts/schemas/shift";
import type { Database, Json } from "@/types/database.generated";

type ShiftClient = SupabaseClient<Database>;

export async function findActiveShiftLocations(supabase: ShiftClient) {
  return supabase
    .from("locations")
    .select("id, name, code")
    .eq("active", true)
    .order("name");
}

export async function findActiveShiftProducts(supabase: ShiftClient) {
  return supabase
    .from("products")
    .select("id, name, code, unit_type, display_order")
    .eq("active", true)
    .order("display_order")
    .order("name");
}

export async function findCurrentOpenShifts(supabase: ShiftClient) {
  return supabase
    .from("work_shifts")
    .select(`
      id,
      location_id,
      operational_date,
      opened_at,
      status,
      opening:openings(
        id,
        cash_opening,
        created_at,
        items:opening_items(product_id, quantity)
      )
    `)
    .eq("status", "OPEN")
    .order("opened_at", { ascending: false });
}

export async function executeOpenShift(
  supabase: ShiftClient,
  input: OpenShiftInput,
) {
  return supabase.rpc("open_operational_shift", {
    selected_cash_opening: input.cash_opening,
    selected_items: input.items as Json,
    selected_location_id: input.location_id,
  });
}
