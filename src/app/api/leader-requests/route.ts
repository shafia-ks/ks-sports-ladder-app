import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("leader_requests")
      .select("*")
      .order("requested_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ requests: data ?? [] });
  } catch (error) {
    console.error("GET /api/leader-requests error:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { user_id, requested_role, reason } = body;

    // Only allow organizer role requests (admin role is reserved for system admins only)
    if (requested_role !== "organizer") {
      return NextResponse.json(
        { error: "Only organizer role can be requested" },
        { status: 400 }
      );
    }

    // Check if user already has a pending request
    const { data: existing } = await supabaseAdmin
      .from("leader_requests")
      .select("id")
      .eq("user_id", user_id)
      .eq("status", "pending")
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending organizer request" },
        { status: 400 }
      );
    }

    // Create new request
    const { data, error } = await supabaseAdmin
      .from("leader_requests")
      .insert({
        user_id,
        requested_role,
        reason,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("POST /api/leader-requests error:", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
