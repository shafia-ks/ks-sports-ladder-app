import { NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  const userId = user.id;

  const [
    membershipsResult,
    pendingChallengesResult,
    pendingMatchesResult,
    upcomingMatchesResult,
    recentActivityResult,
    invitationsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("ladder_memberships")
      .select("ladder_id, current_rank, join_date, status, ladders(id, name, sport_id, status, profile_picture_url)")
      .eq("user_id", userId)
      .eq("status", "active"),

    supabaseAdmin
      .from("challenges")
      .select("id, ladder_id, challenger_id, status, created_at, expires_at")
      .eq("challenged_id", userId)
      .eq("status", "Pending")
      .order("created_at", { ascending: false })
      .limit(10),

    supabaseAdmin
      .from("matches")
      .select("id, ladder_id, player1_id, player2_id, status, played_at, set_scores, winner_id")
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .in("status", ["ScoreSubmitted", "Disputed"])
      .order("played_at", { ascending: false })
      .limit(10),

    supabaseAdmin
      .from("matches")
      .select("id, ladder_id, player1_id, player2_id, scheduled_time, status")
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .eq("status", "Pending")
      .gte("scheduled_time", new Date().toISOString())
      .lte(
        "scheduled_time",
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      )
      .order("scheduled_time", { ascending: true })
      .limit(5),

    supabaseAdmin
      .from("audit_logs")
      .select("id, entity_type, entity_id, action, created_at")
      .eq("performed_by", userId)
      .order("created_at", { ascending: false })
      .limit(20),

    supabaseAdmin
      .from("invitations")
      .select("id, ladder_id, status, invited_by, created_at, ladders(name)")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return NextResponse.json({
    memberships: membershipsResult.data ?? [],
    pendingChallenges: pendingChallengesResult.data ?? [],
    pendingMatches: pendingMatchesResult.data ?? [],
    upcomingMatches: upcomingMatchesResult.data ?? [],
    recentActivity: recentActivityResult.data ?? [],
    invitations: invitationsResult.data ?? [],
  });
}
