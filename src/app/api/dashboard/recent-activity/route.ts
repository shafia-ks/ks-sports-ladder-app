import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
        return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ error: "Database not available" }, { status: 500 });
        }

        const { data: matches, error } = await supabaseAdmin
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
        ladders (name),
        player1:users!matches_player1_id_fkey (full_name),
        player2:users!matches_player2_id_fkey (full_name)
      `)
            .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
            .eq("status", "Confirmed")
            .order("played_at", { ascending: false })
            .limit(10);

        if (error) {
            console.error("[GET /api/dashboard/recent-activity] Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const activities = (matches || []).map((match) => {
            const isPlayer1 = match.player1_id === userId;
            const opponent = isPlayer1 ? (match.player2 as any) : (match.player1 as any);
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
                // TODO: Calculate rank change from ranking_history
                rank_change: undefined,
            };
        });

        return NextResponse.json({ activities });
    } catch (error: any) {
        console.error("[GET /api/dashboard/recent-activity] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
