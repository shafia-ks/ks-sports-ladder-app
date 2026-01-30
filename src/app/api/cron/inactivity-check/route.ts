import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * POST /api/cron/inactivity-check
 * 
 * Daily cron job to check all ladders for inactivity penalties.
 * This should be called once per day by a cron service (e.g., Vercel Cron, GitHub Actions).
 * 
 * Security: In production, this should be protected by a secret token.
 */
export async function POST(req: Request) {
    // Verify cron secret (optional but recommended)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    try {
        // Get all ladders with inactivity system enabled
        const { data: ladders, error: laddersError } = await supabaseAdmin
            .from("ladder_inactivity_settings")
            .select("ladder_id, enabled")
            .eq("enabled", true);

        if (laddersError) {
            console.error("Error fetching ladders:", laddersError);
            return NextResponse.json({
                error: "Failed to fetch ladders"
            }, { status: 500 });
        }

        if (!ladders || ladders.length === 0) {
            return NextResponse.json({
                message: "No ladders with inactivity system enabled",
                laddersProcessed: 0,
                totalPenalties: 0,
                totalWarnings: 0,
            });
        }

        const results = [];
        let totalPenalties = 0;
        let totalWarnings = 0;

        // Process each ladder
        for (const ladder of ladders) {
            try {
                // Call the apply penalties endpoint for this ladder
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ladders/${ladder.ladder_id}/apply-inactivity-penalties`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

                const result = await response.json();

                if (response.ok) {
                    totalPenalties += result.penaltiesApplied || 0;
                    totalWarnings += result.warningsSent || 0;

                    results.push({
                        ladderId: ladder.ladder_id,
                        success: true,
                        penaltiesApplied: result.penaltiesApplied,
                        warningsSent: result.warningsSent,
                    });
                } else {
                    results.push({
                        ladderId: ladder.ladder_id,
                        success: false,
                        error: result.error,
                    });
                }
            } catch (error) {
                console.error(`Error processing ladder ${ladder.ladder_id}:`, error);
                results.push({
                    ladderId: ladder.ladder_id,
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }

        return NextResponse.json({
            success: true,
            laddersProcessed: ladders.length,
            totalPenalties,
            totalWarnings,
            results,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error("Error in inactivity cron job:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}

// Allow GET for testing (remove in production)
export async function GET(req: Request) {
    return NextResponse.json({
        message: "Inactivity check cron job endpoint",
        usage: "POST to this endpoint to trigger the daily inactivity check",
        note: "In production, this should be called by a cron service with proper authentication",
    });
}
