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
  const { data: challenge } = await supabaseAdmin
    .from("challenges")
    .select("challenger_id, challenged_id, ladder_id, status")
    .eq("id", params.id)
    .single();

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  const updateData: any = {};

  if (parsed.data.status) {
    updateData.status = parsed.data.status;

    // Set timestamps based on status
    if (parsed.data.status === "Accepted") {
      updateData.accepted_at = new Date().toISOString();

      // Auto-create match when challenge is accepted
      const { data: matchData, error: matchError } = await supabaseAdmin
        .from("matches")
        .insert({
          ladder_id: challenge.ladder_id,
          player1_id: challenge.challenger_id,
          player2_id: challenge.challenged_id,
          challenge_id: params.id,
          status: "in_progress",
          sets: [],
          confirmed_by: [],
        })
        .select("id")
        .single();

      if (matchError) {
        console.error("[PATCH /api/challenges/:id] Match creation error:", matchError.message);
        return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
      }

      updateData.match_id = matchData.id;

      // Cancel other pending challenges for both players
      await supabaseAdmin.rpc("cancel_other_pending_challenges", {
        p_accepted_challenge_id: params.id
      });

    } else if (parsed.data.status === "Declined") {
      updateData.declined_at = new Date().toISOString();
    } else if (parsed.data.status === "Cancelled") {
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancelled_by = parsed.data.cancelled_by;
      updateData.cancellation_reason = parsed.data.cancellation_reason;
    } else if (parsed.data.status === "Completed") {
      updateData.completed_at = new Date().toISOString();
    }
  }

  // Handle counter proposal fields (may be null, but should update if explicitly sent)
  if ("counter_proposal_time" in parsed.data) updateData.counter_proposal_time = parsed.data.counter_proposal_time;
  if ("counter_proposal_location" in parsed.data) updateData.counter_proposal_location = parsed.data.counter_proposal_location;
  if ("counter_proposal_notes" in parsed.data) updateData.counter_proposal_notes = parsed.data.counter_proposal_notes;

  if (parsed.data.scheduled_at) updateData.scheduled_at = parsed.data.scheduled_at;
  if (parsed.data.location) updateData.location = parsed.data.location;

  console.log("[PATCH /api/challenges/:id] updateData:", updateData, "requestBody:", json);

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("challenges")
    .update(updateData)
    .eq("id", params.id)
    .select("challenger_id, challenged_id, status")
    .single();

  if (error) {
    console.error("[PATCH /api/challenges/:id] DB error:", error.message, "updateData:", updateData);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create audit log
  await createAuditLog({
    entityType: "challenge",
    entityId: params.id,
    action: `Challenge ${parsed.data.status?.toLowerCase() || "updated"}${parsed.data.cancellation_reason ? `: ${parsed.data.cancellation_reason}` : ""}`,
    performedBy: parsed.data.cancelled_by || data?.challenged_id || data?.challenger_id || "",
  });

  // Send notification to the other party
  let notifyUserId = "";
  let notifyMessage = "";

  if (parsed.data.status === "Accepted") {
    notifyUserId = data?.challenger_id || "";
    notifyMessage = "Your challenge was accepted";
  } else if (parsed.data.status === "Declined") {
    notifyUserId = data?.challenger_id || "";
    notifyMessage = "Your challenge was declined";
  } else if (parsed.data.status === "Cancelled") {
    notifyUserId = data?.challenged_id || "";
    notifyMessage = `Challenge cancelled: ${parsed.data.status?.toLowerCase()}`;
  }

  if (notifyUserId) {
    const notificationType = parsed.data.status === "Accepted"
      ? "challenge_accepted"
      : parsed.data.status === "Declined"
        ? "challenge_declined"
        : "challenge_accepted"; // fallback

    await createNotification({
      userId: notifyUserId,
      type: notificationType as any,
      message: notifyMessage,
      link: `/challenges`,
    });
  }

  return NextResponse.json({ ok: true, message: "Challenge updated" });
}

