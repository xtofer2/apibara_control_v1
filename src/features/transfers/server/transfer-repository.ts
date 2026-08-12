import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ReceiveTransferInput, SendTransferInput } from "@/features/transfers/schemas/transfer";
import type { Database, Json } from "@/types/database.generated";

type TransferClient = SupabaseClient<Database>;

export function findTransferLocations(supabase: TransferClient) {
  return supabase.from("locations").select("id, name, code").eq("active", true).order("name");
}

export function findTransferProducts(supabase: TransferClient) {
  return supabase.from("products").select("id, name, code, unit_type, display_order")
    .eq("active", true).order("display_order").order("name");
}

export function findTransferOpenShifts(supabase: TransferClient) {
  return supabase.from("work_shifts")
    .select("id, location_id, opened_at, location:locations(id, name, code)")
    .eq("status", "OPEN").order("opened_at", { ascending: false });
}

export function findTransferHistory(supabase: TransferClient) {
  return supabase.from("transfers").select(`
    id, origin_location_id, destination_location_id, destination_work_shift_id,
    status, sent_at, received_at, reception_notes, created_by,
    origin:locations!transfers_origin_location_id_fkey(id, name, code),
    destination:locations!transfers_destination_location_id_fkey(id, name, code),
    creator:profiles!transfers_created_by_fkey(full_name),
    receiver:profiles!transfers_received_by_fkey(full_name),
    items:transfer_items(product_id, sent_quantity, received_quantity)
  `).order("created_at", { ascending: false }).limit(30);
}

export function executeSendTransfer(supabase: TransferClient, input: SendTransferInput) {
  return supabase.rpc("send_transfer", {
    selected_destination_location_id: input.destination_location_id,
    selected_items: input.items as Json,
    selected_origin_work_shift_id: input.origin_work_shift_id,
  });
}

export function executeReceiveTransfer(supabase: TransferClient, input: ReceiveTransferInput) {
  return supabase.rpc("receive_transfer", {
    selected_destination_work_shift_id: input.destination_work_shift_id,
    selected_items: input.items as Json,
    selected_reception_notes: input.reception_notes || "",
    selected_transfer_id: input.transfer_id,
  });
}
