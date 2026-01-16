import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase env vars missing" },
      { status: 500 } as ResponseInit
    );
  }

  try {
    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from("invitations")
      .select(
        `
        id,
        email,
        ladder_id,
        status,
        expires_at,
        created_at,
        ladders ( id, name )
      `
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 } as ResponseInit
      );
    }

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 410 } as ResponseInit
      );
    }

    if (data.status !== "pending") {
      return NextResponse.json(
        { error: "Invitation is no longer pending" },
        { status: 400 } as ResponseInit
      );
    }

    return NextResponse.json({ invitation: data });
  } catch (error) {
    console.error("GET /api/invitations/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation" },
      { status: 500 } as ResponseInit
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase env vars missing" },
      { status: 500 } as ResponseInit
    );
  }

  try {
    const { id } = params;
    const body = await req.json();
    const { action, user_id } = body;

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'accept' or 'reject'" },
        { status: 400 } as ResponseInit
      );
    }

    // Get invitation
    const { data: invitation, error: fetchError } = await supabaseAdmin
      .from("invitations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 } as ResponseInit
      );
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "Invitation is no longer pending" },
        { status: 400 } as ResponseInit
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 } as ResponseInit
      );
    }

    if (action === "reject") {
      // Just mark as expired
      const { error } = await supabaseAdmin
        .from("invitations")
        .update({ status: "expired" })
        .eq("id", id);

      if (error) throw error;

      return NextResponse.json({ message: "Invitation rejected" });
    }

    // Accept invitation
    if (!user_id) {
      return NextResponse.json(
        { error: "user_id required to accept invitation" },
        { status: 400 } as ResponseInit
      );
    }

    // If ladder_id, add user to ladder membership
    if (invitation.ladder_id) {
      // Get current max rank to assign new member to last position
      const { data: ranks } = await supabaseAdmin
        .from("ladder_memberships")
        .select("current_rank")
        .eq("ladder_id", invitation.ladder_id)
        .eq("status", "active")
        .order("current_rank", { ascending: false })
        .limit(1);

      const nextRank = (ranks?.[0]?.current_rank ?? 0) + 1;

      const { error: membershipError } = await supabaseAdmin
        .from("ladder_memberships")
        .insert({
          ladder_id: invitation.ladder_id,
          user_id,
          status: "active",
          current_rank: nextRank,
          join_date: new Date().toISOString(),
          accepted_at: new Date().toISOString(),
          accepted_by: invitation.invited_by,
        });

      if (membershipError && !membershipError.message.includes("duplicate")) {
        throw membershipError;
      }

      // Create membership event for activity feed
      await supabaseAdmin
        .from("membership_events")
        .insert({
          ladder_id: invitation.ladder_id,
          user_id,
          event_type: "joined",
        });

      // Get user info and ladder info for notifications
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("full_name, email")
        .eq("id", user_id)
        .single();

      const { data: ladderData } = await supabaseAdmin
        .from("ladders")
        .select("name")
        .eq("id", invitation.ladder_id)
        .single();

      if (userData && ladderData) {
        const { createNotification } = await import("@/lib/supabase/notifications");

        // Notify all other active members
        const { data: activeMembers } = await supabaseAdmin
          .from("ladder_memberships")
          .select("user_id")
          .eq("ladder_id", invitation.ladder_id)
          .eq("status", "active")
          .neq("user_id", user_id);

        const memberName = userData.full_name || userData.email || "A new member";

        if (activeMembers) {
          for (const member of activeMembers) {
            await createNotification({
              userId: member.user_id,
              type: "membership_added",
              message: `${memberName} joined ${ladderData.name}`,
              link: `/ladders/${invitation.ladder_id}`,
            });
          }
        }
      }
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabaseAdmin
      .from("invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({
      message: invitation.ladder_id
        ? "Invitation accepted and you've been added to the ladder"
        : "Invitation accepted",
    });
  } catch (error) {
    console.error("PATCH /api/invitations/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to process invitation" },
      { status: 500 } as ResponseInit
    );
  }
}
