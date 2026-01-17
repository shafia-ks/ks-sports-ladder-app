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
      .select("id, user_id, current_rank, accepted_at, status")
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

    // 3. Identify Active members and handle Zombies/Duplicates
    const activeMembersMap = new Map(); // user_id -> member
    const updates = [];

    for (const member of allMembers) {
      if (member.status !== 'active') {
        // Zombie cleanup (inactive with rank)
        if (member.current_rank !== null) {
          updates.push(
            supabaseAdmin.from("ladder_memberships").update({ current_rank: null }).eq("id", member.id)
          );
        }
      } else {
        // Check for duplicates
        if (activeMembersMap.has(member.user_id)) {
          // Duplicate found. Keep the RECENT one (or the one with better rank?)
          // Usually keeping the one with valid rank is better.
          const existing = activeMembersMap.get(member.user_id);
          let toArchive;
          let toKeep;

          // Heuristic: Keep the one with a Rank, or if both have rank, keep newer?
          // User said "Rank 4 is stale". Implies the duplicate has Rank 4.
          // If Benni has Rank 5 (New) and Rank 4 (Old Stale).
          // We want to keep Rank 5.
          // So if accepted_at of 'member' > 'existing', 'member' is newer.
          // Let's keep the NEWER membership.
          if (new Date(member.accepted_at) > new Date(existing.accepted_at)) {
            toKeep = member;
            toArchive = existing;
          } else {
            toKeep = existing;
            toArchive = member;
          }

          // Archive the stale one
          updates.push(
            supabaseAdmin.from("ladder_memberships").update({ status: 'archived', current_rank: null }).eq("id", toArchive.id)
          );
          activeMembersMap.set(member.user_id, toKeep); // Update map
        } else {
          activeMembersMap.set(member.user_id, member);
        }
      }
    }

    // Execute cleanups/archiving
    if (updates.length > 0) {
      await Promise.all(updates);
    }

    // Extract unique active members for sorting
    const activeMembers = Array.from(activeMembersMap.values());

    // 3. Sort Active members
    activeMembers.sort((a, b) => {
      // Prioritize members who already have a rank
      if (a.current_rank && b.current_rank) return a.current_rank - b.current_rank;
      if (a.current_rank) return -1;
      if (b.current_rank) return 1;
      // Fallback to accepted_at
      return new Date(a.accepted_at).getTime() - new Date(b.accepted_at).getTime();
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
      message: `Recalculated ranks. Updates needed: ${updatesCount}. Cleanups performed: ${updates.length}.`,
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
