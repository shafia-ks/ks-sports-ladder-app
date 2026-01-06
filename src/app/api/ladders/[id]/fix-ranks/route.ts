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

    // Get all active members with rank 0 or null
    const { data: membersWithoutRank, error: fetchError } = await supabaseAdmin
      .from("ladder_memberships")
      .select("id, user_id, current_rank")
      .eq("ladder_id", id)
      .eq("status", "active")
      .or("current_rank.is.null,current_rank.eq.0")
      .order("accepted_at", { ascending: true });

    if (fetchError) throw fetchError;

    if (!membersWithoutRank || membersWithoutRank.length === 0) {
      return NextResponse.json({ 
        message: "No members need rank assignment",
        fixed: 0 
      });
    }

    // Get the highest current rank (excluding 0 and null)
    const { data: rankedMembers } = await supabaseAdmin
      .from("ladder_memberships")
      .select("current_rank")
      .eq("ladder_id", id)
      .eq("status", "active")
      .not("current_rank", "is", null)
      .gt("current_rank", 0)
      .order("current_rank", { ascending: false })
      .limit(1);

    let nextRank = rankedMembers && rankedMembers.length > 0 
      ? rankedMembers[0].current_rank + 1 
      : 1;

    // Assign ranks to members without ranks
    const updates = membersWithoutRank.map((member) => {
      const rank = nextRank++;
      return supabaseAdmin!
        .from("ladder_memberships")
        .update({ current_rank: rank })
        .eq("id", member.id);
    });

    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    
    if (failed?.error) {
      throw new Error(failed.error.message);
    }

    return NextResponse.json({
      message: `Successfully assigned ranks to ${membersWithoutRank.length} member(s)`,
      fixed: membersWithoutRank.length
    });
  } catch (error) {
    console.error("POST /api/ladders/[id]/fix-ranks error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fix ranks" },
      { status: 500 } as ResponseInit
    );
  }
}
