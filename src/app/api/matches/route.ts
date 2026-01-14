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
  ranking: z.array(z.object({ userId: z.string(), currentRank: z.number().int().positive() })).optional(),
  rankingRules: rankingRulesSchema.optional(),
});

export async function GET(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const ladderId = searchParams.get("ladderId");
  const status = searchParams.get("status");

  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from("matches")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

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

  const { data: matches, count, error } = await query;
  if (error) {
    console.error("[GET /api/matches] Error fetching matches:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch user data for all players
  if (matches && matches.length > 0) {
    const userIds = new Set<string>();
    matches.forEach(match => {
      if (match.player1_id) userIds.add(match.player1_id);
      if (match.player2_id) userIds.add(match.player2_id);
    });

    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, full_name, email, avatar_url")
      .in("id", Array.from(userIds));

    if (usersError) {
      console.error("[GET /api/matches] Error fetching users:", usersError);
    } else {
      // Create a map of users by ID
      const usersMap = new Map(users?.map(u => [u.id, u]) || []);

      // Enrich matches with user data
      const enrichedMatches = matches.map(match => {
        const p1 = usersMap.get(match.player1_id);
        const p2 = usersMap.get(match.player2_id);
        return {
          ...match,
          player1: p1 ? { ...p1, profile_picture_url: p1.avatar_url } : {
            id: match.player1_id,
            full_name: null,
            email: 'Unknown Player',
            profile_picture_url: null
          },
          player2: p2 ? { ...p2, profile_picture_url: p2.avatar_url } : {
            id: match.player2_id,
            full_name: null,
            email: 'Unknown Player',
            profile_picture_url: null
          },
        };
      });

      return NextResponse.json({ matches: enrichedMatches, count: count || 0, page, limit });
    }
  }

  return NextResponse.json({ matches: matches ?? [], count: count || 0, page, limit });
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

  // Security Check: Verify User ID
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized: Missing user identity" }, { status: 401 });
  }

  // Check Permissions: Must be Player in the match OR Organizer OR Admin
  const isPlayer = userId === parsed.data.player1Id || userId === parsed.data.player2Id;

  // Check if organizer
  const { data: organizer } = await supabaseAdmin
    .from("ladder_leaders")
    .select("role")
    .eq("ladder_id", parsed.data.ladderId)
    .eq("user_id", userId)
    .single();

  // Check if Global Admin
  const { data: userRole } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  const isOrganizer = !!organizer || userRole?.role === "admin";

  if (!isPlayer && !isOrganizer) {
    return NextResponse.json({ error: "Forbidden: You are not authorized to log matches for this ladder." }, { status: 403 });
  }

  // Fetch Current Ranking from DB (Never trust client)
  const { data: members, error: membersError } = await supabaseAdmin
    .from("ladder_memberships")
    .select("user_id, current_rank")
    .eq("ladder_id", parsed.data.ladderId)
    .neq("status", "left") // Exclude left members
    .order("current_rank", { ascending: true });

  if (membersError || !members) {
    return NextResponse.json({ error: "Failed to fetch ladder memberships" }, { status: 500 });
  }

  const currentRanking = members
    .filter(m => m.current_rank !== null)
    .map(m => ({
      userId: m.user_id,
      currentRank: m.current_rank!
    }));

  // Calculate Result using Server-Fetched Ranking
  const result = applyMatchResult({
    ranking: currentRanking,
    winnerId: parsed.data.winnerId,
    loserId: parsed.data.loserId,
    rules: deriveRules(parsed.data.ruleType, parsed.data.rankingRules),
  });

  // Check for existing pending match linked to this challenge
  let matchIdToUpdate = null;
  if (parsed.data.challengeId) {
    const { data: existingMatch } = await supabaseAdmin
      .from("matches")
      .select("id")
      .eq("challenge_id", parsed.data.challengeId)
      .eq("status", "Pending")
      .maybeSingle();

    matchIdToUpdate = existingMatch?.id;
  }

  let matchRow;
  let matchError;

  const matchData = {
    ladder_id: parsed.data.ladderId,
    challenge_id: parsed.data.challengeId ?? null,
    player1_id: parsed.data.player1Id,
    player2_id: parsed.data.player2Id,
    winner_id: parsed.data.winnerId,
    status: "Confirmed",
    set_scores: parsed.data.setScores ?? null,
    played_at: parsed.data.playedAt ?? null,
    confirmed_by: userId,
    submitted_by: userId,
  };

  if (matchIdToUpdate) {
    const res = await supabaseAdmin
      .from("matches")
      .update(matchData)
      .eq("id", matchIdToUpdate)
      .select("id")
      .single();

    matchRow = res.data;
    matchError = res.error;
  } else {
    const res = await supabaseAdmin
      .from("matches")
      .insert(matchData)
      .select("id")
      .single();

    matchRow = res.data;
    matchError = res.error;
  }

  if (parsed.data.challengeId && !matchError) {
    await supabaseAdmin
      .from("challenges")
      .update({ status: "Completed", completed_at: new Date().toISOString() })
      .eq("id", parsed.data.challengeId);
  }

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

  const rankUpdate = await updateLadderRanks({
    ladderId: parsed.data.ladderId,
    ranking: result.ranking,
  });

  if (!rankUpdate.success) {
    return NextResponse.json({ error: rankUpdate.error }, { status: 500 });
  }

  await createAuditLog({
    entityType: "match",
    entityId: matchRow?.id ?? "",
    action: `Ranking updated due to Manual Match #${matchRow?.id}`,
    performedBy: userId,
  });

  const opponentId = parsed.data.player1Id === userId ? parsed.data.player2Id : parsed.data.player1Id;

  if (isOrganizer && userId !== parsed.data.player1Id && userId !== parsed.data.player2Id) {
    await notifyMatchSubmitted({ opponentId: parsed.data.player1Id, submitterId: userId, matchId: matchRow?.id ?? "" });
    await notifyMatchSubmitted({ opponentId: parsed.data.player2Id, submitterId: userId, matchId: matchRow?.id ?? "" });
  } else {
    await notifyMatchSubmitted({
      opponentId,
      submitterId: userId,
      matchId: matchRow?.id ?? "",
    });
  }

  return NextResponse.json({ ok: true, note: result.note, ranking: result.ranking, matchId: matchRow?.id });
}

function deriveRules(ruleType: RankingRuleType, rules?: RankingRules | null): RankingRules {
  if (rules && rules.type) return rules;
  return { type: ruleType };
}
