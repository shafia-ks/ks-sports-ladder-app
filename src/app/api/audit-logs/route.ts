import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");
  const limit = searchParams.get("limit") || "50";

  let query = supabaseAdmin
    .from("audit_logs")
    .select("id, entity_type, entity_id, action, performed_by, created_at")
    .order("created_at", { ascending: false })
    .limit(parseInt(limit));

  if (entityType) {
    query = query.eq("entity_type", entityType);
  }

  if (entityId) {
    query = query.eq("entity_id", entityId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data ?? [] });
}
