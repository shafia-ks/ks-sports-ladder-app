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

      // Set timestamps based on status
      if (parsed.data.status === "Accepted") {
        updateData.accepted_at = new Date().toISOString();

        // Auto-create match when challenge is accepted
        // This creates a "scheduled" match visible to all ladder members
        // Players will later submit results to update winner and rankings
        console.log("[PATCH /api/challenges/:id] Creating scheduled match for accepted challenge");

        const matchInsertData = {
          ladder_id: challenge.ladder_id,
          player1_id: challenge.challenger_id,
          player2_id: challenge.challenged_id,
          challenge_id: params.id,
          status: "Pending", // Changed to capital P to match DB constraint
          winner_id: null, // Will be set when result is submitted
          set_scores: null, // Will be set when result is submitted  
          played_at: null, // Will be set when result is submitted
        };

        console.log("[PATCH /api/challenges/:id] Match data:", matchInsertData);

        // Check if match already exists for this challenge (Idempotency Check)
        const { data: existingMatch } = await supabaseAdmin
          .from("matches")
          .select("id")
          .eq("challenge_id", params.id)
          .maybeSingle();

        if (existingMatch) {
          console.log("[PATCH /api/challenges/:id] Match already exists:", existingMatch.id);
          updateData.match_id = existingMatch.id;
        } else {
          // Create new match only if one doesn't exist
          const { data: matchData, error: matchError } = await supabaseAdmin
            .from("matches")
            .insert(matchInsertData)
            .select("id")
            .single();

          if (matchError) {
            console.error("[PATCH /api/challenges/:id] Match creation failed:");
            console.error("  Error message:", matchError.message);
            console.error("  Error code:", matchError.code);
            console.error("  Error details:", matchError.details);
            console.error("  Error hint:", matchError.hint);

            // Handle unique constraint violation (match already exists for this challenge)
            if (matchError.code === "23505") {
              console.log("[PATCH /api/challenges/:id] Match already exists (unique constraint), fetching it");

              // Try to find existing match by challenge_id first
              const { data: existingMatchRetry } = await supabaseAdmin
                .from("matches")
                .select("id")
                .eq("challenge_id", params.id)
                .maybeSingle();

              if (existingMatchRetry) {
                updateData.match_id = existingMatchRetry.id;
                console.log("[PATCH /api/challenges/:id] Using existing match (by challenge_id):", existingMatchRetry.id);
              } else {
                // If not found by challenge_id, try finding by players
                const { data: matchByPlayers } = await supabaseAdmin
                  .from("matches")
                  .select("id")
                  .eq("ladder_id", challenge.ladder_id)
                  .or(`and(player1_id.eq.${challenge.challenger_id},player2_id.eq.${challenge.challenged_id}),and(player1_id.eq.${challenge.challenged_id},player2_id.eq.${challenge.challenger_id})`)
                  .eq("status", "Pending")
                  .maybeSingle();

                if (matchByPlayers) {
                  updateData.match_id = matchByPlayers.id;
                  console.log("[PATCH /api/challenges/:id] Using existing match (by players):", matchByPlayers.id);

                  // Update the existing match to link it to this challenge
                  await supabaseAdmin
                    .from("matches")
                    .update({ challenge_id: params.id })
                    .eq("id", matchByPlayers.id);
                } else {
                  // This shouldn't happen, but handle gracefully
                  console.error("[PATCH /api/challenges/:id] Match exists but couldn't be retrieved");
                  return NextResponse.json({
                    error: "Match already exists but couldn't be retrieved. The challenge has been accepted.",
                    details: matchError.message
                  }, { status: 200 }); // Return 200 since the challenge IS accepted
                }
              }
            }
            // If status constraint fails, try with capitalized "Pending"
            else if (matchError.code === "23514" || matchError.message?.includes("status")) {
              console.log("[PATCH /api/challenges/:id] Retrying with status 'Pending'");
              const retryData = { ...matchInsertData, status: "Pending" };
              const { data: retryMatch, error: retryError } = await supabaseAdmin
                .from("matches")
                .insert(retryData)
                .select("id")
                .single();

              if (retryError) {
                console.error("[PATCH /api/challenges/:id] Retry also failed:", retryError);
                return NextResponse.json({
                  error: "Failed to create match",
                  details: retryError.message
                }, { status: 500 });
              }

              updateData.match_id = retryMatch.id;
              console.log("[PATCH /api/challenges/:id] Match created successfully (retry):", retryMatch.id);
            } else {
              return NextResponse.json({
                error: "Failed to create match",
                details: matchError.message,
                code: matchError.code
              }, { status: 500 });
            }
          } else {
            updateData.match_id = matchData.id;
            console.log("[PATCH /api/challenges/:id] Match created successfully:", matchData.id);
          }
        }
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

    // Handle counter proposal fields
    if ("counter_proposal_time" in parsed.data) updateData.counter_proposal_time = parsed.data.counter_proposal_time;
    if ("counter_proposal_location" in parsed.data) updateData.counter_proposal_location = parsed.data.counter_proposal_location;
    if ("counter_proposal_notes" in parsed.data) updateData.counter_proposal_notes = parsed.data.counter_proposal_notes;

    if (parsed.data.scheduled_at) updateData.scheduled_at = parsed.data.scheduled_at;
    if (parsed.data.location) updateData.location = parsed.data.location;

    console.log("[PATCH /api/challenges/:id] updateData:", updateData);

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
      console.error("[PATCH /api/challenges/:id] DB error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
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

