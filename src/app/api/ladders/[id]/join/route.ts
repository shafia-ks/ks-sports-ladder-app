import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/supabase/audit";
import { createNotification } from "@/lib/supabase/notifications";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { user_id } = body;

    // Check if ladder is active
    const { data: ladder, error: ladderError } = await supabaseAdmin
      .from("ladders")
      .select("status, name, created_by")
      .eq("id", params.id)
      .single();

    if (ladderError || !ladder) {
      return NextResponse.json({ error: "Ladder not found" }, { status: 404 });
    }

    if (ladder.status !== 'active') {
      return NextResponse.json(
        { error: "Ladder is inactive - join requests are not allowed" },
        { status: 403 }
      );
    }

    // Check if already a member
    const { data: existing } = await supabaseAdmin
      .from("ladder_memberships")
      .select("id")
      .eq("ladder_id", params.id)
      .eq("user_id", user_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Already a member or pending" },
        { status: 400 }
      );
    }

    // Create pending membership (rank 0 until approved)
    const { data, error } = await supabaseAdmin
      .from("ladder_memberships")
      .insert({
        ladder_id: params.id,
        user_id,
        status: "pending",
        current_rank: 0,
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Create audit log
    await createAuditLog({
      entityType: "ladder_membership",
      entityId: data.id,
      action: "Join request submitted",
      performedBy: user_id,
    });

    // Get all ladder leaders
    const { data: leaders } = await supabaseAdmin
      .from("ladder_leaders")
      .select("user_id")
      .eq("ladder_id", params.id);

    // Notify all organizers/leaders
    const organizerIds = [ladder.created_by, ...(leaders?.map(l => l.user_id) || [])];
    const uniqueOrganizers = [...new Set(organizerIds.filter(Boolean))];

    for (const orgId of uniqueOrganizers) {
      await createNotification({
        userId: orgId as string,
        type: "join_request",
        message: `New join request for ${ladder.name || "your ladder"}`,
        link: `/admin/users`,
      });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(`POST /api/ladders/${params.id}/join error:`, error);
    return NextResponse.json({ error: "Failed to join ladder" }, { status: 500 });
  }
}
