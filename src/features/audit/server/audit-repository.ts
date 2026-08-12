import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AuditFilters } from "@/features/audit/schemas/audit";
import type { Database } from "@/types/database.generated";

type AuditClient = SupabaseClient<Database>;

function nextDate(date: string) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

export function findAuditEmployees(supabase: AuditClient) {
  return supabase
    .from("profiles")
    .select("id, full_name")
    .order("full_name");
}

export function findAuditRows(
  supabase: AuditClient,
  filters: AuditFilters,
) {
  let query = supabase
    .from("audit_logs")
    .select(`
      id, user_id, action, entity_type, entity_id,
      old_data, new_data, created_at,
      actor:profiles(full_name)
    `)
    .gte("created_at", `${filters.date}T00:00:00-05:00`)
    .lt("created_at", `${nextDate(filters.date)}T00:00:00-05:00`)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(100);

  if (filters.action) {
    query = query.eq("action", filters.action);
  }

  if (filters.user_id) {
    query = query.eq("user_id", filters.user_id);
  }

  return query;
}
