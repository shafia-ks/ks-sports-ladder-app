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
      const { error: membershipError } = await supabaseAdmin
        .from("ladder_memberships")
        .insert({
          ladder_id: invitation.ladder_id,
          user_id,
          status: "active",
          join_date: new Date().toISOString(),
          accepted_at: new Date().toISOString(),
          accepted_by: invitation.invited_by,
        });

      if (membershipError && !membershipError.message.includes("duplicate")) {
        throw membershipError;
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
