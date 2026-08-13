import { getSupabasePublicEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    getSupabasePublicEnv();

    return Response.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { status: "configuration_error", timestamp: new Date().toISOString() },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
