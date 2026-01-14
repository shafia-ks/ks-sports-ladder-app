import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createNotification } from "@/lib/supabase/notifications";
import { applyMatchResult } from "@/lib/ranking/ranking-engine";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { user_id, action, reason } = body; // action: 'confirm' or 'dispute'

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
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

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

            console.log("[POST /api/matches/:id/confirm] Starting confirmation process...");

            // 1. Fetch Ladder Rules & Members to calculate new ranking
            const { data: ladder, error: ladderError } = await supabaseAdmin
                .from("ladders")
                .select("ranking_rules")
                .eq("id", match.ladder_id)
                .single();

            if (ladderError || !ladder) {
                throw new Error("Failed to fetch ladder rules: " + ladderError?.message);
            }

            const { data: members, error: membersError } = await supabaseAdmin
                .from("ladder_memberships")
                .select("user_id, current_rank")
                .eq("ladder_id", match.ladder_id)
                .neq("status", "left") // Exclude left members
                .order("current_rank", { ascending: true });

            if (membersError || !members) {
                throw new Error("Failed to fetch members: " + membersError?.message);
            }

            // 2. Calculate New Ranking
            const ranking = members
                .filter(m => m.current_rank && m.current_rank > 0)
                .map(m => ({
                    userId: m.user_id,
                    currentRank: m.current_rank!
                }));

            const loserId = match.winner_id === match.player1_id ? match.player2_id : match.player1_id;

            const result = applyMatchResult({
                ranking,
                winnerId: match.winner_id,
                loserId,
                rules: ladder.ranking_rules || { type: "default-swap-minimal-drop" }
            });

            console.log("[POST /api/matches/:id/confirm] New ranking calculated:", result.note);

            // 3. Execute Atomic Transaction via RPC
            const { error: rpcError } = await supabaseAdmin.rpc('confirm_match_and_update_ranks', {
                p_match_id: params.id,
                p_confirmed_by: user_id,
                p_ladder_id: match.ladder_id,
                p_challenge_id: match.challenge_id,
                p_ranking_snapshot: result.ranking
            });

            if (rpcError) {
                console.error("[POST /api/matches/:id/confirm] RPC Transaction Failed:", rpcError);
                // Return 500 but detail for debugging
                return NextResponse.json({ error: "Transaction failed: " + rpcError.message }, { status: 500 });
            }

            console.log("[POST /api/matches/:id/confirm] Transaction successful.");

            // 4. Notifications (Post-Transaction)
            const otherPlayerId = match.player1_id === user_id ? match.player2_id : match.player1_id;

            await createNotification({
                userId: otherPlayerId,
                type: "match_confirmed",
                title: "Match Confirmed",
                message: "Match result confirmed against " + (match.winner_id === user_id ? "Winner" : "Opponent"),
                link: `/ladders/${match.ladder_id}/matches`,
            });

            return NextResponse.json({ success: true, message: "Match confirmed successfully" });

        } else if (action === "dispute") {

            // Update match status to Disputed
            const { error: updateError } = await supabaseAdmin
                .from("matches")
                .update({
                    status: "Disputed",
                    disputed_by: user_id,
                })
                .eq("id", params.id);

            if (updateError) {
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
                        title: "Match Disputed",
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
