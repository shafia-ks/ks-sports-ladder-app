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
            // Check if user is trying to confirm their own submission
            if (match.submitted_by === user_id) {
                return NextResponse.json({
                    error: "You cannot confirm your own submitted score. Please wait for your opponent to confirm."
                }, { status: 403 });
            }

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

            // Trigger ranking update
            console.log("[POST /api/matches/:id/confirm] Starting ranking update...");

            // Fetch ladder ranking rules
            const { data: ladder, error: ladderError } = await supabaseAdmin
                .from("ladders")
                .select("ranking_rules")
                .eq("id", match.ladder_id)
                .single();

            if (ladderError || !ladder) {
                console.error("[POST /api/matches/:id/confirm] Failed to fetch ladder rules:", ladderError);
                // Don't fail the confirmation, just log the error
            } else {
                // Fetch current ladder members with ranks
                const { data: members, error: membersError } = await supabaseAdmin
                    .from("ladder_memberships")
                    .select("user_id, current_rank")
                    .eq("ladder_id", match.ladder_id)
                    .eq("status", "active")
                    .order("current_rank", { ascending: true });

                if (membersError || !members) {
                    console.error("[POST /api/matches/:id/confirm] Failed to fetch members:", membersError);
                } else {
                    // Import ranking engine
                    const { applyMatchResult } = await import("@/lib/ranking/ranking-engine");
                    const { updateLadderRanks } = await import("@/lib/supabase/rankings");

                    // Prepare ranking data
                    const ranking = members
                        .filter(m => m.current_rank && m.current_rank > 0)
                        .map(m => ({
                            userId: m.user_id,
                            currentRank: m.current_rank!
                        }));

                    // Determine loser (the player who is NOT the winner)
                    const loserId = match.winner_id === match.player1_id ? match.player2_id : match.player1_id;

                    // Apply ranking update
                    const result = applyMatchResult({
                        ranking,
                        winnerId: match.winner_id,
                        loserId,
                        rules: ladder.ranking_rules || { type: "default-swap-minimal-drop" }
                    });

                    console.log("[POST /api/matches/:id/confirm] Ranking update result:", result.note);

                    // Update ranks in database
                    const rankUpdate = await updateLadderRanks({
                        ladderId: match.ladder_id,
                        ranking: result.ranking
                    });

                    if (!rankUpdate.success) {
                        console.error("[POST /api/matches/:id/confirm] Failed to update ranks:", rankUpdate.error);
                    } else {
                        console.log("[POST /api/matches/:id/confirm] Rankings updated successfully");

                        // Save to ranking history
                        await supabaseAdmin.from("ranking_history").insert({
                            ladder_id: match.ladder_id,
                            match_id: match.id,
                            snapshot: result.ranking
                        });
                    }
                }
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
