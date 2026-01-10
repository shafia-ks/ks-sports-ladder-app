import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createNotification } from "@/lib/supabase/notifications";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { user_id, action } = body; // action: 'confirm' or 'dispute'

        console.log(`[POST /api/matches/[id]/confirm] Request received. Params ID: ${params.id}, User: ${user_id}, Action: ${action}`);

        // Get match details without join first to avoid schema cache issues
        const { data: match, error: matchError } = await supabaseAdmin
            .from("matches")
            .select("*")
            .eq("id", params.id)
            .single();

        if (matchError) {
            console.error(`[POST /api/matches/[id]/confirm] Match lookup error for ID ${params.id}:`, matchError);
            return NextResponse.json({ error: "Match lookup failed" }, { status: 500 });
        }

        if (!match) {
            console.error(`[POST /api/matches/[id]/confirm] Match not found for ID ${params.id}`);
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        console.log(`[POST /api/matches/[id]/confirm] Match found:`, match.id, "Status:", match.status);

        // Verify user is one of the players
        if (match.player1_id !== user_id && match.player2_id !== user_id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (action === "confirm") {
            // Update match status to Confirmed
            const { error: updateError } = await supabaseAdmin
                .from("matches")
                .update({
                    status: "Confirmed",
                    confirmed_by: user_id,
                })
                .eq("id", params.id);

            if (updateError) {
                console.error("[POST /api/matches/:id/confirm] Error:", updateError);
                return NextResponse.json({ error: updateError.message }, { status: 500 });
            }

            // Notify the other player
            const otherPlayerId = match.player1_id === user_id ? match.player2_id : match.player1_id;
            await createNotification({
                userId: otherPlayerId,
                type: "match_confirmed",
                message: "Match result has been confirmed",
                link: `/ladders/${match.ladder_id}/matches`,
            });

            // TODO: Trigger ranking update here
            console.log("[POST /api/matches/:id/confirm] Match confirmed, rankings should be updated");

            return NextResponse.json({ success: true, message: "Match confirmed successfully" });

        } else if (action === "dispute") {
            const { reason } = body;

            // Update match status to Disputed
            const { error: updateError } = await supabaseAdmin
                .from("matches")
                .update({
                    status: "Disputed",
                    disputed_by: user_id,
                })
                .eq("id", params.id);

            if (updateError) {
                console.error("[POST /api/matches/:id/confirm] Error:", updateError);
                return NextResponse.json({ error: updateError.message }, { status: 500 });
            }

            // Notify organizers about dispute
            const { data: organizers } = await supabaseAdmin
                .from("ladder_leaders")
                .select("user_id")
                .eq("ladder_id", match.ladder_id);

            if (organizers) {
                for (const org of organizers) {
                    await createNotification({
                        userId: org.user_id,
                        type: "match_disputed",
                        message: `Match result disputed${reason ? `: ${reason}` : ""}`,
                        link: `/ladders/${match.ladder_id}/matches`,
                    });
                }
            }

            return NextResponse.json({ success: true, message: "Match disputed, organizers have been notified" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: any) {
        console.error("[POST /api/matches/:id/confirm] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
