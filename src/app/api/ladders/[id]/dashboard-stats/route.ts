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
        .limit(10)
    ] : [Promise.resolve({ data: [] }), Promise.resolve({ data: [] })];

    // 2b. Organizer Stats - Only if leader/admin
    const shouldFetchOrganizerStats = isLeader || userInfo?.role === "admin";

    // 2c. User Actions (Pending Challenges/Matches) - Only if member
    const userActionsPromises = membership ? [
      supabaseAdmin
        .from("challenges")
        .select('*')
        .eq("ladder_id", ladderId)
        .eq("status", "pending")
        .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("matches")
        .select('*')
        .eq("ladder_id", ladderId)
        .in("status", ["pending", "submitted"])
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .order("created_at", { ascending: false })
    ] : [Promise.resolve({ data: [] }), Promise.resolve({ data: [] })];

    // 2d. Global Data (Ladder Challenges, Matches, Activity, Events) - Always fetch
    const globalDataPromises = [
      supabaseAdmin
        .from("challenges")
        .select('*')
        .eq("ladder_id", ladderId)
        .eq("ladder_id", ladderId)
        .order("created_at", { ascending: false })
        .limit(20), // Fetch recent challenges of any status
      supabaseAdmin
        .from("matches")
        .select('*')
        .eq("ladder_id", ladderId)

        // Fetch all matches to show full history
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

    // LOGGING FOR DEBUG
    console.log(`[DashboardStats] Ladder: ${ladderId}, User: ${userId}`);
    console.log(`[DashboardStats] User Matches: ${(results[0] as any)?.data?.length}`);
    console.log(`[DashboardStats] Ladder Matches: ${(results[5] as any)?.data?.length}`);
    console.log(`[DashboardStats] Ladder Challenges: ${(results[4] as any)?.data?.length}`);

    // Extract results by index (order matters!)
    const matchesRes = results[0] as any;
    const rankHistoryRes = results[1] as any;
    const membershipEventsRes = results[7] as any;
    const recentActivity = results[6] as any;

    // Manual User Enrichment logic
    const myChallengesRaw = (results[2] as any).data || [];
    const myMatchesRaw = (results[3] as any).data || [];
    const ladderChallengesRaw = (results[4] as any).data || [];
    const ladderMatchesRaw = (results[5] as any).data || [];
    const rankSnapshots = (results[1] as any).data || [];

    // Process Rank History: Diff the snapshots to find specific user update events
    const rankHistoryRaw: any[] = [];
    if (rankSnapshots && rankSnapshots.length >= 2) {
      for (let i = 0; i < rankSnapshots.length - 1; i++) {
        const currentRef = rankSnapshots[i];
        const prevRef = rankSnapshots[i + 1];
        const currentParams = currentRef.snapshot;
        const prevParams = prevRef.snapshot;

        if (Array.isArray(currentParams) && Array.isArray(prevParams)) {
          currentParams.forEach((curr: any) => {
            const prev = prevParams.find((p: any) => p.userId === curr.userId);
            // Check if rank changed (and valid ranks)
            if (prev && prev.currentRank !== curr.currentRank) {
              rankHistoryRaw.push({
                id: `${currentRef.id}-${curr.userId}`,
                user_id: curr.userId,
                old_rank: prev.currentRank,
                new_rank: curr.currentRank,
                created_at: currentRef.created_at
              });
            }
          });
        }
      }
    }

    // Collect IDs
    const userIds = new Set<string>();
    const addIds = (items: any[], fields: string[]) => {
      items.forEach(item => fields.forEach(f => item[f] && userIds.add(item[f])));
    };
    addIds(myChallengesRaw, ['challenger_id', 'challenged_id']);
    addIds(myMatchesRaw, ['player1_id', 'player2_id']);
    addIds(ladderChallengesRaw, ['challenger_id', 'challenged_id']);
    addIds(ladderMatchesRaw, ['player1_id', 'player2_id']);
    addIds(rankHistoryRaw, ['user_id']);

    // Fetch Users
    const userMap = new Map();
    if (userIds.size > 0) {
      const { data: usersData } = await supabaseAdmin
        .from('users')
        .select('id, full_name, email, avatar_url')
        .in('id', Array.from(userIds));
      if (usersData) usersData.forEach((u: any) => userMap.set(u.id, u));
    }

    // Enrich Helpers
    myChallengesRaw.forEach((c: any) => { c.challenger = userMap.get(c.challenger_id); c.challenged = userMap.get(c.challenged_id); });
    myMatchesRaw.forEach((m: any) => { m.player1 = userMap.get(m.player1_id); m.player2 = userMap.get(m.player2_id); });
    ladderChallengesRaw.forEach((c: any) => { c.challenger = userMap.get(c.challenger_id); c.challenged = userMap.get(c.challenged_id); });
    ladderMatchesRaw.forEach((m: any) => { m.player1 = userMap.get(m.player1_id); m.player2 = userMap.get(m.player2_id); });
    rankHistoryRaw.forEach((r: any) => { r.user = userMap.get(r.user_id); });

    // Reconstruct Responses
    // The original `enrichChallenges` and `enrichMatches` functions are no longer needed as data is enriched in place.
    // We can directly use the `_Raw` variables now.

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
      if (rankSnapshots && rankSnapshots.length >= 2) {
        const currentRank = membership.current_rank;
        const previousSnapshot = rankSnapshots[1].snapshot as any;
        const previousRank = Array.isArray(previousSnapshot)
          ? previousSnapshot.find((r: any) => r.userId === userId)?.currentRank
          : null;
        if (currentRank && previousRank) {
          rankChange = previousRank - currentRank;
        }
      }

      myStats = { rank: membership.current_rank, totalMatches, wins, losses, winRate, streak, rankChange };
    }

    // Process Global Lists
    // Activity Hub should show ALL recent activity, including the user's own actions
    const ladderChallenges = (ladderChallengesRaw || []).slice(0, 10);
    const ladderMatches = (ladderMatchesRaw || []).slice(0, 10);

    const membershipEvents = membershipEventsRes.data || [];

    return NextResponse.json({
      myStats,
      organizerStats,
      recentActivity,
      myChallenges: myChallengesRaw || [],
      myMatches: myMatchesRaw,
      ladderChallenges,
      ladderMatches,
      rankHistory: rankHistoryRaw,
      membershipEvents: membershipEventsRes.data,
    });

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
      player1:users!matches_player1_id_fkey(full_name, first_name, last_name),
      player2:users!matches_player2_id_fkey(full_name, first_name, last_name),
      winner:users!matches_winner_id_fkey(full_name, first_name, last_name)
    `)
    .eq("ladder_id", ladderId)
    .eq("status", "Confirmed")
    .order("played_at", { ascending: false })
    .limit(5);

  if (recentMatchesData) {
    for (const match of recentMatchesData) {
      const p1Name = match.player1?.full_name ||
        `${match.player1?.first_name || ''} ${match.player1?.last_name || ''}`.trim() || "Player";
      const p2Name = match.player2?.full_name ||
        `${match.player2?.first_name || ''} ${match.player2?.last_name || ''}`.trim() || "Player";
      const winnerName = match.winner?.full_name ||
        `${match.winner?.first_name || ''} ${match.winner?.last_name || ''}`.trim() || "Player";

      const loserName = match.winner_id === match.player1_id ? p2Name : p1Name;

      recentActivity.push({
        type: "match",
        description: `${winnerName} defeated ${loserName}`,
        time: formatRelativeTime(new Date(match.played_at || match.created_at)),
        timestamp: new Date(match.played_at || match.created_at).getTime(),
      });
    }
  }

  // Recent challenges
  const { data: recentChallengesData } = await supabaseAdmin
    .from("challenges")
    .select(`
      *,
      challenger:users!challenges_challenger_id_fkey(full_name, first_name, last_name),
      challenged:users!challenges_challenged_id_fkey(full_name, first_name, last_name)
    `)
    .eq("ladder_id", ladderId)
    .limit(5);

  if (recentChallengesData) {
    for (const challenge of recentChallengesData) {
      const challengerName = challenge.challenger?.full_name ||
        `${challenge.challenger?.first_name || ''} ${challenge.challenger?.last_name || ''}`.trim() || "Player";
      const challengedName = challenge.challenged?.full_name ||
        `${challenge.challenged?.first_name || ''} ${challenge.challenged?.last_name || ''}`.trim() || "Player";

      recentActivity.push({
        type: "challenge",
        description: `${challengerName} challenged ${challengedName}`,
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
