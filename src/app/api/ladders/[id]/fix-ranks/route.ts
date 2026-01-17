import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(
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

    // Get all active members from the base TABLE (not view) to ensure updates work
    const { data: members, error: fetchError } = await supabaseAdmin
      .from("ladder_members")
      .select("id, user_id, current_rank, created_at")
      .eq("ladder_id", id)
      .eq("status", "active");

    if (fetchError) throw fetchError;

    if (!members || members.length === 0) {
      return NextResponse.json({
        message: "No active members to rank",
        fixed: 0
      });
    }

    // Sort active members: By Rank (ASC), then Created Date (fallback)
    // We use created_at because accepted_at might miss in base table depending on schema
    members.sort((a, b) => {
      // Prioritize members who already have a rank
      if (a.current_rank && b.current_rank) return a.current_rank - b.current_rank;
      if (a.current_rank) return -1;
      if (b.current_rank) return 1;
      // Fallback to created_at
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    // Assign contiguous ranks 1..N
    let updatesCount = 0;
    const updatePromises = members.map((member, index) => {
      const expectedRank = index + 1;

      // Update only if different
      if (member.current_rank !== expectedRank) {
        updatesCount++;
        return supabaseAdmin!
          .from("ladder_members")
          .update({ current_rank: expectedRank })
          .eq("id", member.id);
      }
      return Promise.resolve({ error: null });
    });

    // Execute updates
    const results = await Promise.all(updatePromises);

    // Check for errors
    const failed = results.find((r: any) => r.error);
    if (failed?.error) {
      console.error("Rank update failed for a member", failed.error);
      throw new Error("Partial failure during rank update");
    }

    return NextResponse.json({
      message: `Recalculated ranks. Updated ${updatesCount} members.`,
      fixed: updatesCount
    });
  } catch (error) {
    console.error("POST /api/ladders/[id]/fix-ranks error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fix ranks" },
      { status: 500 } as ResponseInit
    );
  }
}
