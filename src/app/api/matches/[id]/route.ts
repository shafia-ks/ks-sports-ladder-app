import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/supabase/audit";
import { createNotification } from "@/lib/supabase/notifications";
import { applyMatchResult } from "@/lib/ranking/ranking-engine";
import { updateLadderRanks } from "@/lib/supabase/rankings";

const confirmSchema = z.object({
  matchId: z.string(),
  userId: z.string(),
});

const disputeSchema = z.object({
  matchId: z.string(),
  userId: z.string(),
  reason: z.string(),
});

const updateMatchSchema = z.object({
  winner_id: z.string().optional(),
  set_scores: z.array(z.string()).optional(),
  played_at: z.string().optional(),
  reason: z.string(),
  updated_by: z.string(),
});

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "confirm") {
    const json = await req.json();
    const parsed = confirmSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase env missing" }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("matches")
      .update({ status: "Confirmed", confirmed_by: parsed.data.userId })
      .eq("id", parsed.data.matchId)
      .select("player1_id, player2_id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await createAuditLog({
      entityType: "match",
      entityId: parsed.data.matchId,
      action: "Match confirmed",
      performedBy: parsed.data.userId,
    });

    const otherPlayer = data?.player1_id === parsed.data.userId ? data?.player2_id : data?.player1_id;
    await createNotification({
      userId: otherPlayer ?? "",
      type: "match_confirmed",
      message: `Match result confirmed`,
      link: `/matches/${parsed.data.matchId}`,
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "dispute") {
    const json = await req.json();
    const parsed = disputeSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase env missing" }, { status: 500 });
    }

    const { error } = await supabaseAdmin
      .from("matches")
      .update({ status: "Disputed", disputed_by: parsed.data.userId })
      .eq("id", parsed.data.matchId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await createAuditLog({
      entityType: "match",
      entityId: parsed.data.matchId,
      action: `Match disputed: ${parsed.data.reason}`,
      performedBy: parsed.data.userId,
    });

    // TODO: notify admin/organizer to resolve dispute
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// PATCH: Edit match result (organizers/admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const parsed = updateMatchSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
    }

    const { winner_id, set_scores, played_at, reason, updated_by } = parsed.data;

    // Verify user is organizer or admin
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", updated_by)
      .single();

    if (!user || !["organizer", "admin"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get current match data
    const { data: match, error: matchError } = await supabaseAdmin
      .from("matches")
      .select("*, ladders(ranking_rules)")
      .eq("id", params.id)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Verify user is organizer of this ladder
    const { data: isOrganizer } = await supabaseAdmin
      .from("ladder_leaders")
      .select("id")
      .eq("ladder_id", match.ladder_id)
      .eq("user_id", updated_by)
      .single();

    if (!isOrganizer && user.role !== "admin") {
      return NextResponse.json({ error: "Only ladder organizers can edit matches" }, { status: 403 });
    }

    // Build update object
    const updates: any = {};
    if (winner_id !== undefined) updates.winner_id = winner_id;
    if (set_scores !== undefined) updates.set_scores = set_scores;
    if (played_at !== undefined) updates.played_at = played_at;

    // Update match
    const { error: updateError } = await supabaseAdmin
      .from("matches")
      .update(updates)
      .eq("id", params.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Recalculate rankings if winner changed
    if (winner_id !== undefined && winner_id !== match.winner_id) {
      const loserId = winner_id === match.player1_id ? match.player2_id : match.player1_id;

      // Get current rankings
      const { data: memberships } = await supabaseAdmin
        .from("ladder_memberships")
        .select("user_id, current_rank")
        .eq("ladder_id", match.ladder_id)
        .order("current_rank");

      if (memberships) {
        const ranking = memberships.map((m: any) => ({
          userId: m.user_id,
          currentRank: m.current_rank,
        }));

        // Apply match result
        const result = applyMatchResult({
          ranking,
          winnerId: winner_id,
          loserId,
          rules: match.ladders.ranking_rules,
        });

        // Update rankings
        await updateLadderRanks({
          ladderId: match.ladder_id,
          ranking: result.ranking,
        });

        // Log ranking history
        await supabaseAdmin.from("ranking_history").insert({
          ladder_id: match.ladder_id,
          match_id: params.id,
          snapshot: result.ranking,
        });
      }
    }

    // Log the edit in audit logs
    await supabaseAdmin.from("audit_logs").insert({
      user_id: updated_by,
      action: "match_result_edited",
      resource_type: "match",
      resource_id: params.id,
      details: {
        reason,
        previous_data: match,
        updates,
      },
    });

    return NextResponse.json({ success: true, message: "Match updated successfully" });
  } catch (error) {
    console.error(`PATCH /api/matches/${params.id} error:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update match" },
      { status: 500 }
    );
  }
}

// DELETE: Remove incorrect match (organizers/admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const reason = searchParams.get("reason");
    const deleted_by = searchParams.get("deleted_by");

    if (!reason || !deleted_by) {
      return NextResponse.json({ error: "Reason and deleted_by required" }, { status: 400 });
    }

    // Verify user is organizer or admin
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", deleted_by)
      .single();

    if (!user || !["organizer", "admin"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get match data before deletion
    const { data: match, error: matchError } = await supabaseAdmin
      .from("matches")
      .select("*")
      .eq("id", params.id)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Verify user is organizer of this ladder
    const { data: isOrganizer } = await supabaseAdmin
      .from("ladder_leaders")
      .select("id")
      .eq("ladder_id", match.ladder_id)
      .eq("user_id", deleted_by)
      .single();

    if (!isOrganizer && user.role !== "admin") {
      return NextResponse.json({ error: "Only ladder organizers can delete matches" }, { status: 403 });
    }

    // Log the deletion in audit logs BEFORE deleting
    await supabaseAdmin.from("audit_logs").insert({
      user_id: deleted_by,
      action: "match_deleted",
      resource_type: "match",
      resource_id: params.id,
      details: {
        reason,
        match_data: match,
      },
    });

    // Delete match
    const { error: deleteError } = await supabaseAdmin
      .from("matches")
      .delete()
      .eq("id", params.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    // Note: Rankings should be recalculated based on remaining matches
    // This is a complex operation that might require replaying all matches
    // For now, organizers will need to manually adjust rankings if needed

    return NextResponse.json({ 
      success: true, 
      message: "Match deleted successfully",
      note: "Rankings may need manual adjustment after match deletion"
    });
  } catch (error) {
    console.error(`DELETE /api/matches/${params.id} error:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete match" },
      { status: 500 }
    );
  }
}
