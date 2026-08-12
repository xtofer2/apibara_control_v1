import type { Json } from "@/types/database.generated";

export type AuditRow = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Json | null;
  new_data: Json | null;
  created_at: string;
  actor: { full_name: string } | null;
};
