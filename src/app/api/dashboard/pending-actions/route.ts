import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
        return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    try {
        const actions: any[] = [];

        if (!supabaseAdmin) {
            return NextResponse.json({ error: "Database not available" }, { status: 500 });
        }

        // 1. Get pending challenges (where user is challenged)
        const { data: challenges } = await supabaseAdmin
            .from("challenges")
            .select(`
        id,
        challenger_id,
        challenged_id,
        ladder_id,
        status,
        expires_at,
        ladders (name),
        challenger:users!challenges_challenger_id_fkey (full_name),
        challenged:users!challenges_challenged_id_fkey (full_name)
      `)
            .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
            .eq("status", "Pending");

        if (challenges) {
            for (const challenge of challenges) {
                // Only show if user is the challenged party
                if (challenge.challenged_id === userId) {
                    actions.push({
                        id: challenge.id,
                        type: "challenge",
                        ladder_id: challenge.ladder_id,
                        ladder_name: (challenge.ladders as any)?.name || "Unknown Ladder",
                        opponent_name: (challenge.challenger as any)?.full_name || "Unknown",
                        expires_at: challenge.expires_at,
                        status: challenge.status,
                    });
                }
            }
        }

        // 2. Get matches awaiting score confirmation
        const { data: matches } = await supabaseAdmin
            .from("matches")
            .select(`
        id,
        player1_id,
        player2_id,
        ladder_id,
        status,
        submitted_by,
        ladders (name),
        player1:users!matches_player1_id_fkey (full_name),
        player2:users!matches_player2_id_fkey (full_name)
      `)
            .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
            .eq("status", "ScoreSubmitted");

        if (matches) {
            for (const match of matches) {
                // Only show if user didn't submit the score
                if (match.submitted_by !== userId) {
                    const opponentName =
                        match.player1_id === userId
                            ? (match.player2 as any)?.full_name
                            : (match.player1 as any)?.full_name;

                    actions.push({
                        id: match.id,
                        type: "confirm_score",
                        ladder_id: match.ladder_id,
                        ladder_name: (match.ladders as any)?.name || "Unknown Ladder",
                        opponent_name: opponentName || "Unknown",
                        status: match.status,
                        match_id: match.id,
                    });
                }
            }
        }

        // 3. Get matches awaiting score submission (status: Pending)
        const { data: pendingMatches } = await supabaseAdmin
            .from("matches")
            .select(`
        id,
        player1_id,
        player2_id,
        ladder_id,
        status,
        ladders (name),
        player1:users!matches_player1_id_fkey (full_name),
        player2:users!matches_player2_id_fkey (full_name)
      `)
            .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
            .eq("status", "Pending");

        if (pendingMatches) {
            for (const match of pendingMatches) {
                const opponentName =
                    match.player1_id === userId
                        ? (match.player2 as any)?.full_name
                        : (match.player1 as any)?.full_name;

                actions.push({
                    id: match.id,
                    type: "submit_score",
                    ladder_id: match.ladder_id,
                    ladder_name: (match.ladders as any)?.name || "Unknown Ladder",
                    opponent_name: opponentName || "Unknown",
                    status: match.status,
                    match_id: match.id,
                });
            }
        }

        // Sort by expires_at (challenges first, then others)
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
