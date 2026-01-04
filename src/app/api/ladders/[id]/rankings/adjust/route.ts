import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 } as ResponseInit);
  }

  try {
    const body = await req.json();
    const { rankings, reason, adjusted_by } = body;

    if (!rankings || !Array.isArray(rankings)) {
      return NextResponse.json({ error: "Rankings array required" }, { status: 400 } as ResponseInit);
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: "Adjustment reason required" }, { status: 400 } as ResponseInit);
    }

    if (!adjusted_by) {
      return NextResponse.json({ error: "Adjusted by user ID required" }, { status: 400 } as ResponseInit);
    }

    // Verify user is organizer or admin
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", adjusted_by)
      .single();

    if (!user || !["organizer", "admin"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 } as ResponseInit);
    }

    // Verify user is organizer of this ladder
    const { data: isOrganizer } = await supabaseAdmin
      .from("ladder_leaders")
      .select("id")
      .eq("ladder_id", params.id)
      .eq("user_id", adjusted_by)
      .single();

    if (!isOrganizer && user.role !== "admin") {
      return NextResponse.json({ error: "Only ladder organizers can adjust rankings" }, { status: 403 } as ResponseInit);
    }

    // Get current rankings for audit log
    const { data: currentMembers } = await supabaseAdmin
      .from("ladder_memberships")
      .select("user_id, current_rank, users(full_name, email)")
      .eq("ladder_id", params.id)
      .order("current_rank");

    // Update each member's rank
    const updates = rankings.map((r: { user_id: string; rank: number }) =>
      supabaseAdmin!
        .from("ladder_memberships")
        .update({ current_rank: r.rank })
        .eq("ladder_id", params.id)
        .eq("user_id", r.user_id)
    );

    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      throw new Error(failed.error.message);
    }

    // Log the manual adjustment in audit logs
    await supabaseAdmin.from("audit_logs").insert({
      user_id: adjusted_by,
      action: "manual_ranking_adjustment",
      resource_type: "ladder",
      resource_id: params.id,
      details: {
        reason,
        previous_rankings: currentMembers,
        new_rankings: rankings,
      },
    });

    // Create ranking history snapshot
    await supabaseAdmin.from("ranking_history").insert({
      ladder_id: params.id,
      match_id: null,
      snapshot: rankings.map((r: { user_id: string; rank: number }) => ({
        userId: r.user_id,
        currentRank: r.rank,
      })),
    });

    return NextResponse.json({ success: true, message: "Rankings updated successfully" });
  } catch (error) {
    console.error(`POST /api/ladders/${params.id}/rankings/adjust error:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to adjust rankings" },
      { status: 500 } as ResponseInit
    );
  }
}
