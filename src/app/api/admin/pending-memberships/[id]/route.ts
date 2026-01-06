import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

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
    const { status, admin_id } = body;

    if (!["active", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 } as ResponseInit
      );
    }

    // First, get the membership to find the ladder_id
    const { data: membership, error: fetchError } = await supabaseAdmin
      .from("ladder_memberships")
      .select("ladder_id")
      .eq("id", id)
      .single();

    if (fetchError || !membership) {
      throw new Error("Membership not found");
    }

    const updateData: any = { status };
    
    if (status === "active") {
      updateData.accepted_at = new Date().toISOString();
      updateData.accepted_by = admin_id;

      // Get the highest current rank in this ladder to assign the last position
      const { data: existingMembers } = await supabaseAdmin
        .from("ladder_memberships")
        .select("current_rank")
        .eq("ladder_id", membership.ladder_id)
        .eq("status", "active")
        .not("current_rank", "is", null)
        .order("current_rank", { ascending: false })
        .limit(1);

      const lastRank = existingMembers && existingMembers.length > 0 
        ? existingMembers[0].current_rank 
        : 0;
      
      updateData.current_rank = lastRank + 1;
    }

    const { data, error } = await supabaseAdmin
      .from("ladder_memberships")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ membership: data });
  } catch (error) {
    console.error("PATCH /api/admin/pending-memberships/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update membership" },
      { status: 500 } as ResponseInit
    );
  }
}
