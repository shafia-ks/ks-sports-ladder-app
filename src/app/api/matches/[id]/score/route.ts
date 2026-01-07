import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/supabase/audit";
import { createNotification } from "@/lib/supabase/notifications";
import { applyMatchResult } from "@/lib/ranking/ranking-engine";
import { updateLadderRanks } from "@/lib/supabase/rankings";

const scoreSchema = z.object({
  sets: z.array(z.object({
    set: z.number().int().positive(),
    player1_score: z.number().int().nonnegative(),
    player2_score: z.number().int().nonnegative(),
  })),
  submittedBy: z.string(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const json = await req.json();
  const parsed = scoreSchema.safeParse(json);
  
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env missing" }, { status: 500 });
  }

  // Get match details
  const { data: match, error: matchError } = await supabaseAdmin
    .from("matches")
    .select("*, challenge_id, player1_id, player2_id, ladder_id, confirmed_by, ladders(ranking_rules)")
    .eq("id", params.id)
    .single();

  if (matchError || !match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  // Verify submitter is one of the players
  if (match.player1_id !== parsed.data.submittedBy && match.player2_id !== parsed.data.submittedBy) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Calculate winner from sets
  let player1Wins = 0;
  let player2Wins = 0;
  for (const set of parsed.data.sets) {
    if (set.player1_score > set.player2_score) player1Wins++;
    else if (set.player2_score > set.player1_score) player2Wins++;
  }
  const winnerId = player1Wins > player2Wins ? match.player1_id : match.player2_id;
  const loserId = winnerId === match.player1_id ? match.player2_id : match.player1_id;

  // Add submitter to confirmed_by array
  const confirmedBy = match.confirmed_by || [];
  if (!confirmedBy.includes(parsed.data.submittedBy)) {
    confirmedBy.push(parsed.data.submittedBy);
  }

  const bothConfirmed = confirmedBy.length === 2;

  // Update match
  const updateData: any = {
    sets: parsed.data.sets,
    confirmed_by: confirmedBy,
    winner_id: winnerId,
  };

  if (bothConfirmed) {
    updateData.status = "completed";
    updateData.played_at = new Date().toISOString();
  }

  const { error: updateError } = await supabaseAdmin
    .from("matches")
    .update(updateData)
    .eq("id", params.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Audit log
  await createAuditLog({
    entityType: "match",
    entityId: params.id,
    action: bothConfirmed ? "Match score confirmed by both players" : "Match score submitted",
    performedBy: parsed.data.submittedBy,
  });

  // If both players confirmed, update rankings and complete challenge
  if (bothConfirmed) {
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
        winnerId,
        loserId,
        rules: match.ladders?.ranking_rules || {},
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

    // Complete the challenge
    if (match.challenge_id) {
      await supabaseAdmin
        .from("challenges")
        .update({ 
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", match.challenge_id);
    }

    // Clear is_busy flags
    await supabaseAdmin.rpc("update_player_busy_status", {
      p_user_id: match.player1_id,
      p_ladder_id: match.ladder_id,
    });
    await supabaseAdmin.rpc("update_player_busy_status", {
      p_user_id: match.player2_id,
      p_ladder_id: match.ladder_id,
    });

    // Notify both players
    await createNotification({
      userId: match.player1_id,
      type: "match_completed",
      message: `Match completed! ${winnerId === match.player1_id ? "You won!" : "You lost."}`,
      link: `/matches/${params.id}`,
    });
    await createNotification({
      userId: match.player2_id,
      type: "match_completed",
      message: `Match completed! ${winnerId === match.player2_id ? "You won!" : "You lost."}`,
      link: `/matches/${params.id}`,
    });
  } else {
    // Notify other player to confirm
    const otherPlayer = match.player1_id === parsed.data.submittedBy ? match.player2_id : match.player1_id;
    await createNotification({
      userId: otherPlayer,
      type: "match_score_submitted",
      message: "Your opponent has submitted match scores. Please confirm.",
      link: `/matches/${params.id}`,
    });
  }

  return NextResponse.json({ 
    ok: true, 
    message: bothConfirmed ? "Match completed and rankings updated" : "Score submitted. Waiting for opponent confirmation.",
    bothConfirmed,
  });
}
