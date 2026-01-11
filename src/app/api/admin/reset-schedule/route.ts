import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const confirm = searchParams.get("confirm");

    if (confirm !== "true") {
        return NextResponse.json({
            error: "Safety check failed. Please append '?confirm=true' to the URL to run this destructive action."
        }, { status: 400 });
    }

    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Supabase Admin client not initialized" }, { status: 500 });
    }

    try {
        // 1. Get matches to delete to handle FKs
        const { data: matches } = await supabaseAdmin
            .from("matches")
            .select("id")
            .eq("status", "Confirmed");

        const matchIds = matches?.map(m => m.id) || [];

        // 2. Delete Ranking History for these matches
        if (matchIds.length > 0) {
            const { error: rankError } = await supabaseAdmin
                .from("ranking_history")
                .delete()
                .in("match_id", matchIds);

            if (rankError) throw rankError;
        }

        // 3. Delete ALL Confirmed Matches
        const { error: matchError, count: matchCount } = await supabaseAdmin
            .from("matches")
            .delete({ count: 'exact' })
            .eq("status", "Confirmed");

        if (matchError) throw matchError;

        // 4. Delete ALL Pending/Accepted Challenges
        const { error: challengeError, count: challengeCount } = await supabaseAdmin
            .from("challenges")
            .delete({ count: 'exact' })
            .in("status", ["Pending", "Accepted"]);

        if (challengeError) throw challengeError;

        return NextResponse.json({
            success: true,
            message: "Schedule cleared successfully",
            deletedMatches: matchCount,
            deletedChallenges: challengeCount
        });

    } catch (error: any) {
        console.error("Reset schedule error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
