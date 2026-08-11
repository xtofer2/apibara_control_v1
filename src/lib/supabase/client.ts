import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database.generated";

export function createClient() {
  const { publishableKey, url } = getSupabasePublicEnv();

  return createBrowserClient<Database>(url, publishableKey);
}
