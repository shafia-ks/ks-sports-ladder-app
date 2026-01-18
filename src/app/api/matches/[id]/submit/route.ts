import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { set_scores, winner_id, played_at, location, user_id, status } = body;
        const newStatus = status || "ScoreSubmitted";

        console.log("[PATCH /api/matches/:id/submit] Updating match:", params.id, body);

        // Validate user_id is provided
        if (!user_id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Get match to verify user is a player
        const { data: existingMatch, error: fetchError } = await supabaseAdmin
            .from("matches")
            .select("player1_id, player2_id, status")
            .eq("id", params.id)
            .single();

        if (fetchError || !existingMatch) {
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        // Verify user is one of the players
        if (existingMatch.player1_id !== user_id && existingMatch.player2_id !== user_id) {
            return NextResponse.json({ error: "Unauthorized: You are not a player in this match" }, { status: 403 });
        }

        // Update match with new status ScoreSubmitted
        const { data: match, error } = await supabaseAdmin
            .from("matches")
            .update({
                set_scores,
                winner_id,
                played_at: played_at || new Date().toISOString(),
                location,
                status: newStatus,
                submitted_by: user_id,
            })
            .eq("id", params.id)
            .select()
            .single();

        if (error) {
            console.error("[PATCH /api/matches/:id/submit] Error:", error);
            // Check if it's a state transition error from our trigger
            if (error.message.includes("Invalid match status transition")) {
                // Extract the useful part of the message
                const match = error.message.match(/Invalid match status transition from \w+ to \w+/);
                const msg = match ? match[0] : error.message;
                return NextResponse.json({
                    error: `Cannot submit score: ${msg}`
                }, { status: 400 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log("[PATCH /api/matches/:id/submit] Match updated successfully");
        return NextResponse.json({ match });
    } catch (error: any) {
        console.error("[PATCH /api/matches/:id/submit] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
