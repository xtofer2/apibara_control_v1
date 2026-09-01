import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { CloseShiftInput } from "@/features/closing/schemas/closing";
import type { Database, Json } from "@/types/database.generated";

type ClosingClient = SupabaseClient<Database>;

export function findClosingOpenShifts(supabase: ClosingClient) {
  return supabase.from("work_shifts")
    .select("id, location_id, opened_at, operational_date, location:locations(id, name, code)")
    .eq("status", "OPEN").order("opened_at", { ascending: false });
}

export function findClosingProducts(supabase: ClosingClient) {
  return supabase.from("products")
    .select("id, name, code, unit_type, display_order")
    .eq("active", true).order("display_order").order("name");
}

export function findClosingHistory(supabase: ClosingClient) {
  return supabase.from("closings").select(`
    id, work_shift_id, created_by, created_at,
    creator:profiles(full_name),
    shift:work_shifts(closed_at, operational_date, location:locations(name, code)),
    items:closing_items(product_id, quantity),
    payments:closing_payments(amount, method:payment_methods(code, name))
  `).order("created_at", { ascending: false }).limit(20);
}

export function executeCloseShift(supabase: ClosingClient, input: CloseShiftInput) {
  return supabase.rpc("close_operational_shift", {
    selected_items: input.items as Json,
    selected_operational_date: input.operational_date,
    selected_payments: input.payments as Json,
    selected_work_shift_id: input.work_shift_id,
  });
}
