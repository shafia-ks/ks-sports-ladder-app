import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  try {
    const url = new URL(req.url);
    const ladder_id = url.searchParams.get("ladder_id");
    const user_id = url.searchParams.get("user_id");
    const status = url.searchParams.get("status");

    let query = supabaseAdmin
      .from("leader_requests")
      .select(`
        id,
        user_id,
        ladder_id,
        requested_role,
        status,
        reason,
        requested_at,
        reviewed_at,
        reviewed_by,
        rejection_reason,
        users(id, email, first_name, last_name),
        ladders(id, name)
      `)
      .order("requested_at", { ascending: false });

    // Filter by ladder (for ladder organizers to see requests for their ladder)
    if (ladder_id) {
      query = query.eq("ladder_id", ladder_id);
    }

    // Filter by user (for checking user's own requests)
    if (user_id) {
      query = query.eq("user_id", user_id);
    }

    // Filter by status
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ requests: data ?? [] });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error("GET /api/leader-requests error:", errorMsg, error);
    return NextResponse.json({ error: errorMsg, details: error }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { user_id, requested_role, reason, ladder_id } = body;

    // Only allow organizer role requests (admin role is reserved for system admins only)
    if (requested_role !== "organizer") {
      return NextResponse.json(
        { error: "Only organizer role can be requested" },
        { status: 400 }
      );
    }

    // Organizer requests MUST include ladder_id
    if (!ladder_id) {
      return NextResponse.json(
        { error: "Organizer request must specify a ladder_id" },
        { status: 400 }
      );
    }

    // Verify ladder exists
    const { data: ladder } = await supabaseAdmin
      .from("ladders")
      .select("id")
      .eq("id", ladder_id)
      .single();

    if (!ladder) {
      return NextResponse.json(
        { error: "Ladder not found" },
        { status: 404 }
      );
    }

    // Check if user already has a pending request for this specific ladder
    const { data: existing } = await supabaseAdmin
      .from("leader_requests")
      .select("id")
      .eq("user_id", user_id)
      .eq("ladder_id", ladder_id)
      .eq("status", "pending")
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending organizer request for this ladder" },
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
        ladder_id,
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
