import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { status, rejection_reason, admin_id } = body;

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    // Get the request to find user, requested role, and ladder
    const { data: request, error: fetchError } = await supabaseAdmin
      .from("leader_requests")
      .select("user_id, requested_role, ladder_id")
      .eq("id", params.id)
      .single();

    if (fetchError || !request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Update request status
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("leader_requests")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin_id,
        rejection_reason: status === "rejected" ? rejection_reason : null,
      })
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // If approved, handle role assignment
    if (status === "approved") {
      if (request.requested_role === "organizer" && request.ladder_id) {
        // For organizer role, add to ladder_leaders table (ladder-specific)
        const { error: leaderError } = await supabaseAdmin
          .from("ladder_leaders")
          .insert({
            ladder_id: request.ladder_id,
            user_id: request.user_id,
          });

        if (leaderError && !leaderError.message.includes("duplicate")) {
          throw leaderError;
        }

        // Create notification
        await supabaseAdmin.from("notifications").insert({
          user_id: request.user_id,
          type: "role-promoted",
          message: `Your request to become an organizer has been approved!`,
          link: `/ladders/${request.ladder_id}`,
        });
      } else if (request.requested_role === "admin") {
        // For admin role, update global user role
        const { error: roleError } = await supabaseAdmin
          .from("users")
          .update({ role: request.requested_role })
          .eq("id", request.user_id);

        if (roleError) throw roleError;

        // Create notification
        await supabaseAdmin.from("notifications").insert({
          user_id: request.user_id,
          type: "role-promoted",
          message: `Your request to become an admin has been approved!`,
          link: "/admin",
        });
      }
    } else {
      // Create rejection notification
      await supabaseAdmin.from("notifications").insert({
        user_id: request.user_id,
        type: "role-rejected",
        message: `Your request to become a ${request.requested_role} was declined.`,
        link: "/dashboard",
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`PATCH /api/leader-requests/[id] error:`, error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
