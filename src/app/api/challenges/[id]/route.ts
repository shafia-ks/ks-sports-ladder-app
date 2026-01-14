import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/supabase/audit";
import { createNotification } from "@/lib/supabase/notifications";

const updateSchema = z.object({
  status: z.enum(["Accepted", "Declined", "Cancelled", "Completed"]).optional(),
  cancellation_reason: z.string().optional(),
  cancelled_by: z.string().optional(),
  counter_proposal_time: z.string().optional(),
  counter_proposal_location: z.string().optional(),
  counter_proposal_notes: z.string().optional(),
  scheduled_at: z.string().optional(),
  location: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    const parsed = updateSchema.safeParse(json);

    if (!parsed.success) {
      console.error("[PATCH /api/challenges/:id] Validation failed:", parsed.error.issues);
      return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase env missing" }, { status: 500 });
    }

    // Get challenge details first
    const { data: challenge, error: fetchError } = await supabaseAdmin
      .from("challenges")
      .select("challenger_id, challenged_id, ladder_id, status")
      .eq("id", params.id)
      .single();

    if (fetchError || !challenge) {
      console.error("[PATCH /api/challenges/:id] Fetch error:", fetchError);
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (parsed.data.status) {
      updateData.status = parsed.data.status;

      // Set timestamps
      if (parsed.data.status === "Accepted") updateData.accepted_at = new Date().toISOString();
      else if (parsed.data.status === "Declined") updateData.declined_at = new Date().toISOString();
      else if (parsed.data.status === "Cancelled") {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancelled_by = parsed.data.cancelled_by;
        updateData.cancellation_reason = parsed.data.cancellation_reason;
      } else if (parsed.data.status === "Completed") updateData.completed_at = new Date().toISOString();
    }

    // Handle counter proposal fields
    if ("counter_proposal_time" in parsed.data) updateData.counter_proposal_time = parsed.data.counter_proposal_time;
    if ("counter_proposal_location" in parsed.data) updateData.counter_proposal_location = parsed.data.counter_proposal_location;
    if ("counter_proposal_notes" in parsed.data) updateData.counter_proposal_notes = parsed.data.counter_proposal_notes;
    if (parsed.data.scheduled_at) updateData.scheduled_at = parsed.data.scheduled_at;
    if (parsed.data.location) updateData.location = parsed.data.location;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // ATTEMPT: Linear and Straightforward Flow

    // 1. CLEAN UP: Proactively delete any existing "Pending" match for these players
    // This prevents the "duplicate key" error effectively clearing the path for the Trigger
    const { data: existingZombie } = await supabaseAdmin
      .from("matches")
      .select("id")
      .eq("ladder_id", challenge.ladder_id)
      .or(`and(player1_id.eq.${challenge.challenger_id},player2_id.eq.${challenge.challenged_id}),and(player1_id.eq.${challenge.challenged_id},player2_id.eq.${challenge.challenger_id})`)
      .eq("status", "Pending")
      .maybeSingle();

    if (existingZombie) {
      console.log(`[PATCH] Removing existing pending match ${existingZombie.id} to allow acceptance`);
      await supabaseAdmin.from("matches").delete().eq("id", existingZombie.id);
    }

    // 2. ACCEPT: Update the challenge status
    // The DB Trigger 'create_match_on_challenge_accept' will run and create a fresh match
    const { data, error } = await supabaseAdmin
      .from("challenges")
      .update(updateData)
      .eq("id", params.id)
      .select("challenger_id, challenged_id, status, ladder_id")
      .single();

    if (error) {
      console.error("[PATCH /api/challenges/:id] DB error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. LINK: Connect the Trigger-Created Match to this Challenge
    if (parsed.data.status === "Accepted" && data) {
      // Find the newly created match (created just now)
      const { data: newMatch } = await supabaseAdmin
        .from("matches")
        .select("id")
        .eq("ladder_id", data.ladder_id)
        .or(`and(player1_id.eq.${data.challenger_id},player2_id.eq.${data.challenged_id}),and(player1_id.eq.${data.challenged_id},player2_id.eq.${data.challenger_id})`)
        .eq("status", "Pending")
        .is("challenge_id", null)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (newMatch) {
        console.log(`[PATCH] Linking new match ${newMatch.id} to challenge ${params.id}`);
        await supabaseAdmin
          .from("matches")
          .update({ challenge_id: params.id })
          .eq("id", newMatch.id);
      }
    }

    // Create audit log and notifications (wrapped in try/catch just in case)
    try {
      await createAuditLog({
        entityType: "challenge",
        entityId: params.id,
        action: `Challenge ${parsed.data.status?.toLowerCase() || "updated"}`,
        performedBy: parsed.data.cancelled_by || data?.challenged_id || data?.challenger_id || "system",
      });

      if (parsed.data.status) {
        let notifyUserId = "";
        let notifyMessage = "";
        if (parsed.data.status === "Accepted") {
          notifyUserId = data?.challenger_id || "";
          notifyMessage = "Your challenge was accepted";
        } else if (parsed.data.status === "Declined") {
          notifyUserId = data?.challenger_id || "";
          notifyMessage = "Your challenge was declined";
        }

        if (notifyUserId) {
          await createNotification({
            userId: notifyUserId,
            type: parsed.data.status === "Accepted" ? "challenge_accepted" : "challenge_declined",
            message: notifyMessage,
            link: `/challenges`,
          });
        }
      }
    } catch (logError) {
      console.error("Failed to create log/notification (non-fatal):", logError);
    }

    return NextResponse.json({ ok: true, message: "Challenge updated" });

  } catch (err: any) {
    console.error("[PATCH /api/challenges/:id] Unexpected error:", err);
    return NextResponse.json({ error: "Internal Server Error: " + (err.message || String(err)) }, { status: 500 });
  }
}

