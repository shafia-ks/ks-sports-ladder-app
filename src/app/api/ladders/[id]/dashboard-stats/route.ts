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
    const ladderId = params.id;

    if (!userId) {
      return await getPublicStats(ladderId);
    }

    // PHASE 1: Identifiers & Permissions (Parallel)
    const [membershipRes, isLeaderRes, userInfoRes] = await Promise.all([
      supabaseAdmin
        .from("ladder_memberships")
        .select("*")
        .eq("ladder_id", ladderId)
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle(),
      supabaseAdmin
        .from("ladder_leaders")
        .select("id")
        .eq("ladder_id", ladderId)
        .eq("user_id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", userId)
        .maybeSingle()
    ]);

    const membership = membershipRes.data;
    const isLeader = isLeaderRes.data;
    const userInfo = userInfoRes.data;

    // PHASE 2: Data Gathering (Parallel)
    // We construct an array of promises based on roles/membership

    // 2a. User Stats (Matches & Rank History) - Only if member
    const statsPromises = membership ? [
      supabaseAdmin
        .from("matches")
        .select("id, winner_id, player1_id, player2_id, created_at, status")
        .eq("ladder_id", ladderId)
        .in("status", ["Confirmed", "completed"])
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("ranking_history")
        .select("*")
        .eq("ladder_id", ladderId)
        .order("created_at", { ascending: false })
        .limit(2)
    ] : [Promise.resolve({ data: [] }), Promise.resolve({ data: [] })];

    // 2b. Organizer Stats - Only if leader/admin
    const shouldFetchOrganizerStats = isLeader || userInfo?.role === "admin";

    // 2c. User Actions (Pending Challenges/Matches) - Only if member
    const userActionsPromises = membership ? [
      supabaseAdmin
        .from("challenges")
        .select(`
          *,
          challenger:users!challenges_challenger_id_fkey(id, full_name, email, avatar_url),
          challenged:users!challenges_challenged_id_fkey(id, full_name, email, avatar_url)
        `)
        .eq("ladder_id", ladderId)
        .eq("status", "pending")
        .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("matches")
        .select(`
          *,
          player1:users!matches_player1_id_fkey(id, full_name, email, avatar_url),
          player2:users!matches_player2_id_fkey(id, full_name, email, avatar_url)
        `)
        .eq("ladder_id", ladderId)
        .in("status", ["pending", "submitted"])
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .order("created_at", { ascending: false })
    ] : [Promise.resolve({ data: [] }), Promise.resolve({ data: [] })];

    // 2d. Global Data (Ladder Challenges, Matches, Activity, Events) - Always fetch
    const globalDataPromises = [
      supabaseAdmin
        .from("challenges")
        .select(`
          *,
          challenger:users!challenges_challenger_id_fkey(id, full_name, email, avatar_url),
          challenged:users!challenges_challenged_id_fkey(id, full_name, email, avatar_url)
        `)
        .eq("ladder_id", ladderId)
        .in("status", ["pending", "accepted"])
        .order("created_at", { ascending: false })
        .limit(20), // Fetch more to filter later
      supabaseAdmin
        .from("matches")
        .select(`
          *,
          player1:users!matches_player1_id_fkey(id, full_name, email, avatar_url),
          player2:users!matches_player2_id_fkey(id, full_name, email, avatar_url)
        `)
        .eq("ladder_id", ladderId)
        .in("status", ["Pending", "Submitted", "Confirmed"])
        .order("created_at", { ascending: false })
        .limit(50),
      getRecentActivity(ladderId),
      supabaseAdmin
        .from("membership_events")
        .select(`
          *,
          users(id, full_name, email, avatar_url)
        `)
        .eq("ladder_id", ladderId)
        .order("created_at", { ascending: false })
        .limit(20)
    ];

    // Execute all data fetches in parallel
    const results = await Promise.all([
      ...statsPromises,
      ...userActionsPromises,
      ...globalDataPromises
    ]);

    // Extract results by index (order matters!)
    // Stats results
    const matchesRes = results[0] as any;
    const rankHistoryRes = results[1] as any;

    // User Actions results
    const myChallengesRes = results[2] as any;
    const myMatchesRes = results[3] as any;

    // Global results
    const ladderChallengesRawRes = results[4] as any;
    const ladderMatchesRawRes = results[5] as any;
    const recentActivity = results[6] as any;
    const membershipEventsRes = results[7] as any;

    // Handle Organizer Stats separately (optional to parallelize further but logic is custom)
    let organizerStats = null;
    if (shouldFetchOrganizerStats) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [activeChalls, recentMatches] = await Promise.all([
        supabaseAdmin.from("challenges").select("*", { count: "exact", head: true }).eq("ladder_id", ladderId).in("status", ["pending", "accepted"]),
        supabaseAdmin.from("matches").select("*", { count: "exact", head: true }).eq("ladder_id", ladderId).eq("status", "completed").gte("played_at", sevenDaysAgo.toISOString())
      ]);

      organizerStats = {
        activeChallenges: activeChalls.count || 0,
        recentMatches: recentMatches.count || 0
      };
    }

    // Process User Stats
    let myStats = null;
    if (membership && matchesRes.data) {
      const matches = matchesRes.data;
      const totalMatches = matches.length;
      const wins = matches.filter((m: any) => m.winner_id === userId).length;
      const losses = totalMatches - wins;
      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

      let streak = 0;
      if (matches.length > 0) {
        if (matches[0].winner_id === userId) {
          for (const match of matches) {
            if (match.winner_id === userId) streak++;
            else break;
          }
        }
      }

      let rankChange = null;
      if (rankHistoryRes.data && rankHistoryRes.data.length >= 2) {
        const currentRank = membership.current_rank;
        const previousSnapshot = rankHistoryRes.data[1].snapshot as any;
        const previousRank = previousSnapshot.find((r: any) => r.userId === userId)?.currentRank;
        if (currentRank && previousRank) {
          rankChange = previousRank - currentRank;
        }
      }

      myStats = { rank: membership.current_rank, totalMatches, wins, losses, winRate, streak, rankChange };
    }

    // Process Global Lists
    // Filter ladder challenges: not involving current user
    const ladderChallenges = (ladderChallengesRawRes.data || [])
      .filter((c: any) => c.challenger_id !== userId && c.challenged_id !== userId)
      .slice(0, 10);

    // Filter ladder matches: Confirmed & involving user OR Pending/Submitted & not involving user
    const ladderMatches = (ladderMatchesRawRes.data || [])
      .filter((m: any) =>
        (m.status === 'Confirmed' && (m.player1_id === userId || m.player2_id === userId)) ||
        (m.status !== 'Confirmed' && m.player1_id !== userId && m.player2_id !== userId)
      )
      .slice(0, 10);

    const membershipEvents = membershipEventsRes.data || [];

    return NextResponse.json({
      myStats,
      organizerStats,
      recentActivity,
      myChallenges: myChallengesRes.data || [],
      myMatches: myMatchesRes.data || [],
      ladderChallenges,
      ladderMatches,
      membershipEvents,
    } as ResponseInit);

  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
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
