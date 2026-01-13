import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/supabase/audit";

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  const userId = req.headers.get("x-user-id");
  let isAdmin = false;

  if (userId) {
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle(); // Use maybeSingle to avoid errors if sync hasn't happened

    if (user?.role === "admin") {
      isAdmin = true;
    }
  }

  let query = supabaseAdmin
    .from("ladders")
    .select("id, name, description, sport_id, location, status, visibility, challenge_rules, ranking_rules, created_at, profile_picture_url, created_by")
    .order("created_at", { ascending: false });

  // Only filter by public visibility if NOT an admin
  if (!isAdmin) {
    query = query.eq("visibility", "public");
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ladders: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const {
      name,
      description,
      sport_id,
      location,
      visibility,
      challenge_rules,
      ranking_rules,
      created_by,
    } = body;

    // Create ladder
    const { data: ladder, error: ladderError } = await supabaseAdmin
      .from("ladders")
      .insert({
        name,
        description,
        sport_id,
        location,
        visibility,
        challenge_rules,
        ranking_rules,
        created_by,
      })
      .select()
      .single();

    if (ladderError) throw ladderError;

    // Add creator as leader
    await supabaseAdmin.from("ladder_leaders").insert({
      ladder_id: ladder.id,
      user_id: created_by,
    });

    // Add creator as active member
    await supabaseAdmin.from("ladder_memberships").insert({
      ladder_id: ladder.id,
      user_id: created_by,
      current_rank: 1,
      status: "active",
      accepted_at: new Date().toISOString(),
      accepted_by: created_by,
    });

    // Create audit log
    await createAuditLog({
      entityType: "ladder",
      entityId: ladder.id,
      action: `Ladder created: ${name}`,
      performedBy: created_by,
    });

    return NextResponse.json(ladder, { status: 201 });
  } catch (error) {
    console.error("POST /api/ladders error:", error);
    return NextResponse.json({ error: "Failed to create ladder" }, { status: 500 });
  }
}
