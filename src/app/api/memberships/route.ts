import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// Returns memberships for a given user_id. Intended for authenticated client calls.
export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("ladder_memberships")
      .select(
        `id, ladder_id, status, current_rank, requested_at, accepted_at, ladders ( id, name, location, status )`
      )
      .eq("user_id", userId)
      .order("accepted_at", { ascending: true });

    if (error) throw error;

    const memberships = data ?? [];
    const active = memberships.filter((m) => m.status === "active");
    const pending = memberships.filter((m) => m.status === "pending");

    return NextResponse.json({ memberships, active, pending });
  } catch (error) {
    console.error("GET /api/memberships error:", error);
    return NextResponse.json({ error: "Failed to load memberships" }, { status: 500 });
  }
}