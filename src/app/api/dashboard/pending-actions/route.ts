import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
        return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    try {
        const supabase = createClient();
        const actions: any[] = [];
        const userIds = new Set<string>();

        // 1. Get pending challenges (Raw)
        const { data: challenges, error: challengesError } = await supabase
            .from("challenges")
            .select(`
                id,
                challenger_id,
                challenged_id,
                ladder_id,
                status,
                expires_at,
                ladders (name)
            `)
            .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
            .eq("status", "Pending");

        if (challengesError) throw challengesError;

        // Collect challenge user IDs
        challenges?.forEach(c => {
            if (c.challenger_id) userIds.add(c.challenger_id);
            if (c.challenged_id) userIds.add(c.challenged_id);
        });

        // 2. Get matches awaiting score confirmation (Raw)
        const { data: matches, error: matchesError } = await supabase
            .from("matches")
            .select(`
                id,
                player1_id,
                player2_id,
                ladder_id,
                status,
                submitted_by,
                ladders (name)
            `)
            .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
            .eq("status", "ScoreSubmitted");

        if (matchesError) throw matchesError;

        // Collect match user IDs
        matches?.forEach(m => {
            if (m.player1_id) userIds.add(m.player1_id);
            if (m.player2_id) userIds.add(m.player2_id);
        });

        // 3. Get matches awaiting score submission (Raw)
        const { data: pendingMatches, error: pendingError } = await supabase
            .from("matches")
            .select(`
                id,
                player1_id,
                player2_id,
                ladder_id,
                status,
                ladders (name)
            `)
            .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
            .eq("status", "Pending");

        if (pendingError) throw pendingError;

        // Collect pending match user IDs
        pendingMatches?.forEach(m => {
            if (m.player1_id) userIds.add(m.player1_id);
            if (m.player2_id) userIds.add(m.player2_id);
        });

        // 4. Fetch Users manually
        const { data: users } = await supabase
            .from("users")
            .select("id, full_name")
            .in("id", Array.from(userIds));

        const userMap = new Map(users?.map(u => [u.id, u]) || []);

        // 5. Build Actions List

        // Challenges
        if (challenges) {
            for (const challenge of challenges) {
                if (challenge.challenged_id === userId) {
                    const challenger = userMap.get(challenge.challenger_id);
                    actions.push({
                        id: challenge.id,
                        type: "challenge",
                        ladder_id: challenge.ladder_id,
                        ladder_name: (challenge.ladders as any)?.name || "Unknown Ladder",
                        opponent_name: challenger?.full_name || "Unknown",
                        expires_at: challenge.expires_at,
                        status: challenge.status,
                    });
                }
            }
        }

        // Matches Confirm
        if (matches) {
            for (const match of matches) {
                if (match.submitted_by !== userId) {
                    const player1 = userMap.get(match.player1_id);
                    const player2 = userMap.get(match.player2_id);
                    const opponent = match.player1_id === userId ? player2 : player1;

                    actions.push({
                        id: match.id,
                        type: "confirm_score",
                        ladder_id: match.ladder_id,
                        ladder_name: (match.ladders as any)?.name || "Unknown Ladder",
                        opponent_name: opponent?.full_name || "Unknown",
                        status: match.status,
                        match_id: match.id,
                    });
                }
            }
        }

        // Pending Matches
        if (pendingMatches) {
            for (const match of pendingMatches) {
                const player1 = userMap.get(match.player1_id);
                const player2 = userMap.get(match.player2_id);
                const opponent = match.player1_id === userId ? player2 : player1;

                actions.push({
                    id: match.id,
                    type: "submit_score",
                    ladder_id: match.ladder_id,
                    ladder_name: (match.ladders as any)?.name || "Unknown Ladder",
                    opponent_name: opponent?.full_name || "Unknown",
                    status: match.status,
                    match_id: match.id,
                });
            }
        }

        // Sort by expires_at
        actions.sort((a, b) => {
            if (a.expires_at && !b.expires_at) return -1;
            if (!a.expires_at && b.expires_at) return 1;
            if (a.expires_at && b.expires_at) {
                return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
            }
            return 0;
        });

        return NextResponse.json({ actions });
    } catch (error: any) {
        console.error("[GET /api/dashboard/pending-actions] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
