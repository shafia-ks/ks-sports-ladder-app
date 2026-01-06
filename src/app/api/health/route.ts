import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasService = Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

  let dbOk: boolean | null = null;
  let dbError: string | null = null;

  if (supabaseAdmin) {
    try {
      // Cheap DB probe: head-only select with count to avoid returning data
      const { error } = await supabaseAdmin
        .from("ladders")
        .select("id", { count: "exact", head: true });
      dbOk = !error;
      dbError = error ? error.message : null;
    } catch (err: unknown) {
      dbOk = false;
      dbError = err instanceof Error ? err.message : "Unknown error";
    }
  }

  return NextResponse.json({
    env: {
      hasUrl,
      hasAnon,
      hasService,
    },
    supabaseAdminAvailable: Boolean(supabaseAdmin),
    dbOk,
    dbError,
    timestamp: new Date().toISOString(),
  });
}
