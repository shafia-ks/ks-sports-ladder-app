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
                ladder_id,
                played_at,
                location,
                ladders (name, image_url)
            `)
            .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
            .eq("status", "Confirmed")
            .gte("played_at", new Date().toISOString())
            .order("played_at", { ascending: true })
            .limit(5);

        if (error) {
            console.error("[GET /api/dashboard/upcoming-matches] Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 2. Fetch Users manually to avoid ambiguous FK errors
        const userIds = new Set<string>();
        matches?.forEach(m => {
            if (m.player1_id) userIds.add(m.player1_id);
            if (m.player2_id) userIds.add(m.player2_id);
        });

        const { data: users } = await supabase
            .from("users")
            .select("id, full_name, avatar_url")
            .in("id", Array.from(userIds));

        const userMap = new Map(users?.map(u => [u.id, u]) || []);

        // 3. Merge Data
        const formattedMatches = (matches || []).map((match) => {
            const player1 = userMap.get(match.player1_id);
            const player2 = userMap.get(match.player2_id);

            const isPlayer1 = match.player1_id === userId;
            const opponent = isPlayer1 ? player2 : player1;
            const ladders = match.ladders as any;

            return {
                id: match.id,
                ladder_id: match.ladder_id,
                ladder_name: ladders?.name || "Unknown Ladder",
                ladder_image: ladders?.image_url,
                opponent_name: opponent?.full_name || "Unknown",
                opponent_avatar: opponent?.avatar_url,
                played_at: match.played_at,
                location: match.location,
            };
        });

        return NextResponse.json({ matches: formattedMatches });
    } catch (error: any) {
        console.error("[GET /api/dashboard/upcoming-matches] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
