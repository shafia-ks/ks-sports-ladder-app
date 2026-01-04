import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendEmail, createInvitationEmailHTML } from "@/lib/supabase/email";

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase env vars missing" },
      { status: 500 } as ResponseInit
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "email parameter required" },
        { status: 400 } as ResponseInit
      );
    }

    // Get pending invitations for this email
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
        invited_by,
        ladders ( id, name )
      `
      )
      .eq("email", email)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ invitations: data ?? [] });
  } catch (error) {
    console.error("GET /api/invitations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 } as ResponseInit
    );
  }
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase env vars missing" },
      { status: 500 } as ResponseInit
    );
  }

  try {
    const body = await req.json();
    const { email, invited_by, ladder_id } = body;

    if (!email || !invited_by) {
      return NextResponse.json(
        { error: "email and invited_by required" },
        { status: 400 } as ResponseInit
      );
    }

    // Verify inviter has permission (organizer or admin)
    const { data: inviter } = await supabaseAdmin
      .from("users")
      .select("role, email, full_name")
      .eq("id", invited_by)
      .single();

    if (!inviter || !["organizer", "admin"].includes(inviter.role)) {
      return NextResponse.json(
        { error: "Only organizers and admins can send invitations" },
        { status: 403 } as ResponseInit
      );
    }

    // If ladder_id provided, verify inviter is an organizer for that ladder
    if (ladder_id) {
      const { data: leader } = await supabaseAdmin
        .from("ladder_leaders")
        .select("id")
        .eq("ladder_id", ladder_id)
        .eq("user_id", invited_by)
        .single();

      if (inviter.role === "organizer" && !leader) {
        return NextResponse.json(
          { error: "You must be an organizer of this ladder to invite members" },
          { status: 403 } as ResponseInit
        );
      }
    }

    // Check if invitation already exists and is pending
    const { data: existing } = await supabaseAdmin
      .from("invitations")
      .select("id")
      .eq("email", email)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "An active invitation already exists for this email" },
        { status: 400 } as ResponseInit
      );
    }

    // Create invitation (expires in 30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data, error } = await supabaseAdmin
      .from("invitations")
      .insert({
        email,
        invited_by,
        ladder_id: ladder_id || null,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Get ladder name if inviting to specific ladder
    let ladderName: string | undefined;
    if (ladder_id) {
      const { data: ladderData } = await supabaseAdmin
        .from("ladders")
        .select("name")
        .eq("id", ladder_id)
        .single();
      ladderName = ladderData?.name;
    }

    // Send invitation email
    const inviterName = inviter?.full_name || inviter?.email || "An organizer";
    const emailHTML = createInvitationEmailHTML(
      data.id,
      inviterName,
      ladderName
    );

    await sendEmail({
      to: email,
      subject: `You're invited to join ${ladderName || "KS Sports Ladder"}!`,
      html: emailHTML,
    });

    return NextResponse.json(
      { invitation: data, message: "Invitation sent successfully" },
      { status: 201 } as ResponseInit
    );
  } catch (error) {
    console.error("POST /api/invitations error:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 } as ResponseInit
    );
  }
}
