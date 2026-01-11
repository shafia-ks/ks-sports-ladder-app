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

        // 1. Fetch Matches (Raw)
        const { data: matches, error } = await supabase
            .from("matches")
            .select(`
                id,
                player1_id,
                player2_id,
                winner_id,
                ladder_id,
                set_scores,
                played_at,
                created_at,
                ladders (name)
            `)
            .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
            .eq("status", "Confirmed")
            .order("created_at", { ascending: false })
            .limit(10);

        if (error) {
            console.error("[GET /api/dashboard/recent-activity] Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 2. Fetch Users manually
        const userIds = new Set<string>();
        matches?.forEach(m => {
            if (m.player1_id) userIds.add(m.player1_id);
            if (m.player2_id) userIds.add(m.player2_id);
        });

        const { data: users } = await supabase
            .from("users")
            .select("id, full_name")
            .in("id", Array.from(userIds));

        const userMap = new Map(users?.map(u => [u.id, u]) || []);

        // 3. Merge Data
        const activities = (matches || []).map((match) => {
            const player1 = userMap.get(match.player1_id);
            const player2 = userMap.get(match.player2_id);

            const isPlayer1 = match.player1_id === userId;
            const opponent = isPlayer1 ? player2 : player1;
            const ladders = match.ladders as any;
            const won = match.winner_id === userId;

            return {
                id: match.id,
                ladder_id: match.ladder_id,
                ladder_name: ladders?.name || "Unknown Ladder",
                opponent_name: opponent?.full_name || "Unknown",
                won,
                set_scores: match.set_scores || [],
                played_at: match.played_at || match.created_at,
                rank_change: undefined,
            };
        });

        return NextResponse.json({ activities });
    } catch (error: any) {
        console.error("[GET /api/dashboard/recent-activity] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
