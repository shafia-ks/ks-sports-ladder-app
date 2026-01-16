import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase env vars missing" },
      { status: 500 } as ResponseInit
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      // Return public stats only (no personal stats)
      return await getPublicStats(params.id);
    }

    const ladderId = params.id;

    // Get user's membership in this ladder
    const { data: membership } = await supabaseAdmin
      .from("ladder_memberships")
      .select("*")
      .eq("ladder_id", ladderId)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    // Get user's match stats
    let myStats = null;
    let rankChange = null;

    if (membership) {
      // Get all confirmed matches for this user in this ladder
      const { data: matches } = await supabaseAdmin
        .from("matches")
        .select("id, winner_id, player1_id, player2_id, created_at, status")
        .eq("ladder_id", ladderId)
        .in("status", ["Confirmed", "completed"])
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      const totalMatches = matches?.length || 0;
      const wins = matches?.filter((m: any) => m.winner_id === userId).length || 0;
      const losses = totalMatches - wins;
      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

      // Calculate current WIN streak (consecutive wins from most recent matches)
      let streak = 0;
      if (matches && matches.length > 0) {
        // Check if last match was a win
        const lastMatchWasWin = matches[0].winner_id === userId;

        if (lastMatchWasWin) {
          // Count consecutive wins from the start
          for (const match of matches) {
            if (match.winner_id === userId) {
              streak++;
            } else {
              break; // Stop at first loss
            }
          }
        }
        // If last match was a loss, streak is 0
      }

      // Get rank change (compare to previous rank snapshot)
      const { data: rankHistory } = await supabaseAdmin
        .from("ranking_history")
        .select("*")
        .eq("ladder_id", ladderId)
        .order("created_at", { ascending: false })
        .limit(2);

      if (rankHistory && rankHistory.length >= 2) {
        const currentRank = membership.current_rank;
        const previousSnapshot = rankHistory[1].snapshot as any;
        const previousRank = previousSnapshot.find((r: any) => r.userId === userId)?.currentRank;
        if (currentRank && previousRank) {
          rankChange = previousRank - currentRank; // Positive means moved up
        }
      }

      myStats = {
        rank: membership.current_rank,
        totalMatches,
        wins,
        losses,
        winRate,
        streak,
        rankChange,
      };
    }

    // Check if user is organizer
    const { data: isLeader } = await supabaseAdmin
      .from("ladder_leaders")
      .select("id")
      .eq("ladder_id", ladderId)
      .eq("user_id", userId)
      .maybeSingle();

    // Get user info to check admin role
    const { data: userInfo } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    // Get organizer stats if applicable
    let organizerStats = null;
    if (isLeader || userInfo?.role === "admin") {
      // Count active challenges
      const { count: activeChallenges } = await supabaseAdmin
        .from("challenges")
        .select("*", { count: "exact", head: true })
        .eq("ladder_id", ladderId)
        .in("status", ["pending", "accepted"]);

      // Count recent matches (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: recentMatches } = await supabaseAdmin
        .from("matches")
        .select("*", { count: "exact", head: true })
        .eq("ladder_id", ladderId)
        .eq("status", "completed")
        .gte("played_at", sevenDaysAgo.toISOString());

      organizerStats = {
        activeChallenges: activeChallenges || 0,
        recentMatches: recentMatches || 0,
      };
    }

    // Get recent activity (last 10 items)
    const recentActivity = await getRecentActivity(ladderId);

    // Get user's active challenges
    let myChallenges = [];
    let myMatches = [];
    if (membership) {
      const { data: challengesData } = await supabaseAdmin
        .from("challenges")
        .select(`
          *,
          challenger:users!challenges_challenger_id_fkey(id, full_name, email, avatar_url),
          challenged:users!challenges_challenged_id_fkey(id, full_name, email, avatar_url)
        `)
        .eq("ladder_id", ladderId)
        .eq("status", "pending")
        .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      myChallenges = challengesData || [];

      // Get user's active matches (pending or submitted)
      const { data: matchesData } = await supabaseAdmin
        .from("matches")
        .select(`
          *,
          player1:users!matches_player1_id_fkey(id, full_name, email, avatar_url),
          player2:users!matches_player2_id_fkey(id, full_name, email, avatar_url)
        `)
        .eq("ladder_id", ladderId)
        .in("status", ["pending", "submitted"])
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      myMatches = matchesData || [];
    }

    // Get ladder-wide challenges (excluding user's own)
    const { data: ladderChallengesData } = await supabaseAdmin
      .from("challenges")
      .select(`
        *,
        challenger:users!challenges_challenger_id_fkey(id, full_name, email, avatar_url),
        challenged:users!challenges_challenged_id_fkey(id, full_name, email, avatar_url)
      `)
      .eq("ladder_id", ladderId)
      .in("status", ["pending", "accepted"])
      .not("challenger_id", "eq", userId)
      .not("challenged_id", "eq", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    const ladderChallenges = ladderChallengesData || [];

    // Get ladder-wide matches
    // Fetch all recent matches and filter in code
    const { data: allMatchesData } = await supabaseAdmin
      .from("matches")
      .select(`
        *,
        player1:users!matches_player1_id_fkey(id, full_name, email, avatar_url),
        player2:users!matches_player2_id_fkey(id, full_name, email, avatar_url)
      `)
      .eq("ladder_id", ladderId)
      .in("status", ["Pending", "Submitted", "Confirmed"])
      .order("created_at", { ascending: false })
      .limit(50); // Fetch more, then filter

    // Filter: Include confirmed matches with user OR non-user pending/submitted matches
    const ladderMatches = (allMatchesData || [])
      .filter(m =>
        (m.status === 'Confirmed' && (m.player1_id === userId || m.player2_id === userId)) ||
        (m.status !== 'Confirmed' && m.player1_id !== userId && m.player2_id !== userId)
      )
      .slice(0, 10);

    return NextResponse.json({
      myStats,
      organizerStats,
      recentActivity,
      myChallenges,
      myMatches,
      ladderChallenges,
      ladderMatches,
    } as ResponseInit);
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard stats" },
      { status: 500 } as ResponseInit
    );
  }
}

async function getPublicStats(ladderId: string) {
  const recentActivity = await getRecentActivity(ladderId);
  return NextResponse.json({
    myStats: null,
    organizerStats: null,
    recentActivity,
  } as ResponseInit);
}

async function getRecentActivity(ladderId: string) {
  if (!supabaseAdmin) return [];

  const recentActivity = [];

  // Recent matches
  const { data: recentMatchesData } = await supabaseAdmin
    .from("matches")
    .select(`
      *,
      challenger:users!matches_challenger_id_fkey(full_name, first_name, last_name),
      opponent:users!matches_opponent_id_fkey(full_name, first_name, last_name),
      winner:users!matches_winner_id_fkey(full_name, first_name, last_name)
    `)
    .eq("ladder_id", ladderId)
    .eq("status", "completed")
    .order("played_at", { ascending: false })
    .limit(5);

  if (recentMatchesData) {
    for (const match of recentMatchesData) {
      const challengerName = match.challenger?.full_name ||
        `${match.challenger?.first_name} ${match.challenger?.last_name}`.trim() || "Player";
      const opponentName = match.opponent?.full_name ||
        `${match.opponent?.first_name} ${match.opponent?.last_name}`.trim() || "Player";
      const winnerName = match.winner?.full_name ||
        `${match.winner?.first_name} ${match.winner?.last_name}`.trim() || "Player";

      recentActivity.push({
        type: "match",
        description: `${winnerName} defeated ${match.winner_id === match.challenger_id ? opponentName : challengerName}`,
        time: formatRelativeTime(new Date(match.played_at)),
        timestamp: new Date(match.played_at).getTime(),
      });
    }
  }

  // Recent challenges
  const { data: recentChallengesData } = await supabaseAdmin
    .from("challenges")
    .select(`
      *,
      challenger:users!challenges_challenger_id_fkey(full_name, first_name, last_name),
      opponent:users!challenges_opponent_id_fkey(full_name, first_name, last_name)
    `)
    .eq("ladder_id", ladderId)
    .in("status", ["pending", "accepted"])
    .order("created_at", { ascending: false })
    .limit(5);

  if (recentChallengesData) {
    for (const challenge of recentChallengesData) {
      const challengerName = challenge.challenger?.full_name ||
        `${challenge.challenger?.first_name} ${challenge.challenger?.last_name}`.trim() || "Player";
      const opponentName = challenge.opponent?.full_name ||
        `${challenge.opponent?.first_name} ${challenge.opponent?.last_name}`.trim() || "Player";

      recentActivity.push({
        type: "challenge",
        description: `${challengerName} challenged ${opponentName}`,
        time: formatRelativeTime(new Date(challenge.created_at)),
        timestamp: new Date(challenge.created_at).getTime(),
      });
    }
  }

  // Sort by timestamp and take top 10
  recentActivity.sort((a, b) => b.timestamp - a.timestamp);
  return recentActivity.slice(0, 10).map(({ timestamp, ...rest }) => rest);
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
