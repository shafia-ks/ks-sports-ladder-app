import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/supabase/audit";
import { createNotification } from "@/lib/supabase/notifications";

/**
 * Cron job endpoint to auto-expire pending challenges
 * Should be called periodically (e.g., every hour) via Vercel Cron or external service
 */
export async function POST(req: Request) {
  // Verify cron secret for security
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  try {
    const now = new Date().toISOString();

    // Find all pending challenges that have expired
    const { data: expiredChallenges, error: fetchError } = await supabaseAdmin
      .from("challenges")
      .select("id, challenger_id, challenged_id")
      .eq("status", "Pending")
      .lt("expires_at", now);

    if (fetchError) {
      throw fetchError;
    }

    if (!expiredChallenges || expiredChallenges.length === 0) {
      return NextResponse.json({ 
        ok: true, 
        message: "No expired challenges found",
        expired: 0 
      });
    }

    // Update all expired challenges
    const { error: updateError } = await supabaseAdmin
      .from("challenges")
      .update({ 
        status: "Expired",
        declined_at: now 
      })
      .eq("status", "Pending")
      .lt("expires_at", now);

    if (updateError) {
      throw updateError;
    }

    // Create audit logs and notifications
    for (const challenge of expiredChallenges) {
      await createAuditLog({
        entityType: "challenge",
        entityId: challenge.id,
        action: "Challenge auto-expired",
        performedBy: "system",
      });

      // Notify both parties
      await Promise.all([
        createNotification({
          userId: challenge.challenger_id,
          type: "challenge_expired",
          message: "Your challenge expired without response",
          link: `/challenges`,
        }),
        createNotification({
          userId: challenge.challenged_id,
          type: "challenge_expired",
          message: "A challenge sent to you has expired",
          link: `/challenges`,
        }),
      ]);
    }

    return NextResponse.json({
      ok: true,
      message: `Expired ${expiredChallenges.length} challenge(s)`,
      expired: expiredChallenges.length,
    });
  } catch (error) {
    console.error("Error expiring challenges:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET() {
  return NextResponse.json({
    message: "Challenge expiry endpoint - use POST with cron secret",
    instructions: "Set CRON_SECRET env var and call POST with Authorization: Bearer <secret>",
  });
}
