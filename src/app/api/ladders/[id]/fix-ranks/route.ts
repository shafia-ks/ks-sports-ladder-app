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

    // 1. Fetch ALL members (active OR holding a rank) to handle zombies/collisions
    // Note: Table name is 'ladder_memberships' (verified in schema), not 'ladder_members'
    const { data: allMembers, error: fetchError } = await supabaseAdmin
      .from("ladder_memberships")
      .select("id, user_id, current_rank, created_at, status")
      .eq("ladder_id", id)
      .or("status.eq.active,current_rank.not.is.null");

    if (fetchError) throw fetchError;

    if (!allMembers || allMembers.length === 0) {
      return NextResponse.json({
        message: "No members found",
        fixed: 0
      });
    }

    let updatesCount = 0;

    // 2. Identify 'Zombie' members (Inactive but holding a rank) AND Active members
    const activeMembers = [];
    const zombieUpdates = [];

    for (const member of allMembers) {
      if (member.status !== 'active') {
        // This is a zombie (left/removed/pending) holding a rank. Clear it.
        // This frees up the rank number for active members.
        if (member.current_rank !== null) {
          zombieUpdates.push(
            supabaseAdmin.from("ladder_memberships").update({ current_rank: null }).eq("id", member.id)
          );
          updatesCount++;
        }
      } else {
        activeMembers.push(member);
      }
    }

    // Execute cleanup of zombies FIRST to avoid collisions or stale data
    if (zombieUpdates.length > 0) {
      await Promise.all(zombieUpdates);
    }

    // 3. Sort Active members
    activeMembers.sort((a, b) => {
      // Prioritize members who already have a rank
      if (a.current_rank && b.current_rank) return a.current_rank - b.current_rank;
      if (a.current_rank) return -1;
      if (b.current_rank) return 1;
      // Fallback to created_at
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    // 4. Reassign contiguous ranks 1..N
    const rankUpdates = [];
    for (let i = 0; i < activeMembers.length; i++) {
      const member = activeMembers[i];
      const expectedRank = i + 1;

      if (member.current_rank !== expectedRank) {
        rankUpdates.push(
          supabaseAdmin.from("ladder_memberships").update({ current_rank: expectedRank }).eq("id", member.id)
        );
        updatesCount++;
      }
    }

    // Execute rank updates
    if (rankUpdates.length > 0) {
      const results = await Promise.all(rankUpdates);
      const failed = results.find((r: any) => r.error);
      if (failed?.error) {
        console.error("Rank update failed", failed.error);
        throw new Error("Partial failure during rank update: " + failed.error.message);
      }
    }

    return NextResponse.json({
      message: `Recalculated ranks. Updates: ${updatesCount} (including ${zombieUpdates.length} cleanups).`,
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
