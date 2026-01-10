import { NextResponse } from "next/server";
import { z } from "zod";
import { applyMatchResult } from "@/lib/ranking/ranking-engine";
import { RankingRules, RankingRuleType } from "@/types/domain";
import { supabaseAdmin } from "@/lib/supabase/server";
import { updateLadderRanks } from "@/lib/supabase/rankings";
import { createAuditLog } from "@/lib/supabase/audit";
import { notifyMatchSubmitted } from "@/lib/supabase/notifications";

const rankingRulesSchema = z.object({
  type: z.custom<RankingRuleType>(),
  kFactor: z.number().optional(),
  maxDrop: z.number().int().optional(),
  bonusWinStreak: z.number().int().optional(),
});

const submitSchema = z.object({
  ladderId: z.string(),
  challengeId: z.string().optional(),
  player1Id: z.string(),
  player2Id: z.string(),
  winnerId: z.string(),
  loserId: z.string(),
  setScores: z.array(z.string()).optional(),
  playedAt: z.string().optional(),
  ruleType: z.custom<RankingRuleType>(),
  ranking: z.array(z.object({ userId: z.string(), currentRank: z.number().int().positive() })),
  rankingRules: rankingRulesSchema.optional(),
});

export async function GET(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const ladderId = searchParams.get("ladderId");
  const status = searchParams.get("status");

  let query = supabaseAdmin
    .from("matches")
    .select(
      `id, ladder_id, challenge_id, player1_id, player2_id, winner_id, status, set_scores, played_at, created_at, disputed_by,
       player1:users!matches_player1_id_fkey(id, full_name, email),
       player2:users!matches_player2_id_fkey(id, full_name, email)`
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (ladderId) {
    query = query.eq("ladder_id", ladderId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  // Filter by user ID if provided (for profile/dashboard history)
  if (req.url.includes("userId")) {
    const userId = searchParams.get("userId");
    if (userId) {
      query = query.or(`player1_id.eq.${userId},player2_id.eq.${userId}`);
    }
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ matches: data ?? [] });
}

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = submitSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  const result = applyMatchResult({
    ranking: parsed.data.ranking,
    winnerId: parsed.data.winnerId,
    loserId: parsed.data.loserId,
    rules: deriveRules(parsed.data.ruleType, parsed.data.rankingRules),
  });

  const { data: matchRow, error: matchError } = await supabaseAdmin
    .from("matches")
    .insert({
      ladder_id: parsed.data.ladderId,
      challenge_id: parsed.data.challengeId ?? null,
      player1_id: parsed.data.player1Id,
      player2_id: parsed.data.player2Id,
      winner_id: parsed.data.winnerId,
      status: "Confirmed",
      set_scores: parsed.data.setScores ?? null,
      played_at: parsed.data.playedAt ?? null,
      confirmed_by: parsed.data.winnerId,
    })
    .select("id")
    .single();

  if (matchError) {
    return NextResponse.json({ error: matchError.message }, { status: 500 });
  }

  const historyInsert = await supabaseAdmin.from("ranking_history").insert({
    ladder_id: parsed.data.ladderId,
    match_id: matchRow?.id ?? null,
    snapshot: result.ranking,
  });

  if (historyInsert.error) {
    return NextResponse.json({ error: historyInsert.error.message }, { status: 500 });
  }

  // Update ladder membership ranks atomically
  const rankUpdate = await updateLadderRanks({
    ladderId: parsed.data.ladderId,
    ranking: result.ranking,
  });

  if (!rankUpdate.success) {
    return NextResponse.json({ error: rankUpdate.error }, { status: 500 });
  }

  // Audit log
  await createAuditLog({
    entityType: "match",
    entityId: matchRow?.id ?? "",
    action: `Ranking updated due to Match #${matchRow?.id}`,
    performedBy: parsed.data.winnerId,
  });

  // Notify opponent
  const opponentId = parsed.data.player1Id === parsed.data.winnerId ? parsed.data.player2Id : parsed.data.player1Id;
  await notifyMatchSubmitted({
    opponentId,
    submitterId: parsed.data.winnerId,
    matchId: matchRow?.id ?? "",
  });

  return NextResponse.json({ ok: true, note: result.note, ranking: result.ranking, matchId: matchRow?.id });
}

function deriveRules(ruleType: RankingRuleType, rules?: RankingRules | null): RankingRules {
  if (rules && rules.type) return rules;
  return { type: ruleType };
}
