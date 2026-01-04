import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; organizerId: string } }
) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase env vars missing" },
      { status: 500 } as ResponseInit
    );
  }

  try {
    const { id, organizerId } = params;
    const { searchParams } = new URL(req.url);
    const requestedBy = searchParams.get("requested_by");

    if (!requestedBy) {
      return NextResponse.json(
        { error: "requested_by query parameter required" },
        { status: 400 } as ResponseInit
      );
    }

    // Verify requester is organizer or admin
    const { data: requester } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", requestedBy)
      .single();

    if (requester?.role === "organizer") {
      // Verify they're an organizer of this ladder
      const { data: isLeader } = await supabaseAdmin
        .from("ladder_leaders")
        .select("id")
        .eq("ladder_id", id)
        .eq("user_id", requestedBy)
        .single();

      if (!isLeader) {
        return NextResponse.json(
          { error: "You must be an organizer of this ladder" },
          { status: 403 } as ResponseInit
        );
      }
    } else if (requester?.role !== "admin") {
      return NextResponse.json(
        { error: "Only organizers and admins can remove organizers" },
        { status: 403 } as ResponseInit
      );
    }

    // Delete organizer
    const { error } = await supabaseAdmin
      .from("ladder_leaders")
      .delete()
      .eq("id", organizerId)
      .eq("ladder_id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Organizer removed successfully" });
  } catch (error) {
    console.error("DELETE /api/ladders/[id]/organizers/[organizerId] error:", error);
    return NextResponse.json(
      { error: "Failed to remove organizer" },
      { status: 500 } as ResponseInit
    );
  }
}
