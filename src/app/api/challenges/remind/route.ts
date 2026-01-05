import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createNotification } from "@/lib/supabase/notifications";

/**
 * Cron job endpoint to send reminders for upcoming accepted challenges
 * Should be called daily via Vercel Cron or external service
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
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find all accepted challenges scheduled within the next 24 hours that haven't been reminded yet
    const { data: upcomingChallenges, error: fetchError } = await supabaseAdmin
      .from("challenges")
      .select("id, challenger_id, challenged_id, scheduled_at")
      .eq("status", "Accepted")
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", in24Hours.toISOString())
      .is("reminded_at", null);

    if (fetchError) {
      throw fetchError;
    }

    if (!upcomingChallenges || upcomingChallenges.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No upcoming challenges to remind",
        reminders: 0,
      });
    }

    // Send reminders and update reminded_at timestamp
    for (const challenge of upcomingChallenges) {
      const scheduledTime = new Date(challenge.scheduled_at!).toLocaleString();
      
      // Notify both players
      await Promise.all([
        createNotification({
          userId: challenge.challenger_id,
          type: "challenge_reminder",
          message: `Reminder: Your match is scheduled for ${scheduledTime}`,
          link: `/challenges`,
        }),
        createNotification({
          userId: challenge.challenged_id,
          type: "challenge_reminder",
          message: `Reminder: Your match is scheduled for ${scheduledTime}`,
          link: `/challenges`,
        }),
      ]);

      // Mark as reminded
      await supabaseAdmin
        .from("challenges")
        .update({ reminded_at: new Date().toISOString() })
        .eq("id", challenge.id);
    }

    return NextResponse.json({
      ok: true,
      message: `Sent ${upcomingChallenges.length} reminder(s)`,
      reminders: upcomingChallenges.length,
    });
  } catch (error) {
    console.error("Error sending reminders:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET() {
  return NextResponse.json({
    message: "Challenge reminder endpoint - use POST with cron secret",
    instructions: "Set CRON_SECRET env var and call POST with Authorization: Bearer <secret>",
  });
}
