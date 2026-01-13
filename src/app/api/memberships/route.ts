import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  try {
    const supabase = createClient();

    // 1. Get memberships with ladder details
    // REMOVED: .eq("status", "active") to get ALL memberships
    const { data: memberships, error } = await supabase
      .from("ladder_memberships")
      .select(`
        *,
        ladders (
          id,
          name,
          sport_id,
          profile_picture_url,
          status,
          visibility,
          description,
          location
        )
      `)
      .eq("user_id", userId)
      .order("join_date", { ascending: false });

    if (error) {
      console.error("[GET /api/memberships] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Calculate match counts for each membership
    // We do this by querying matches table for this user per ladder
    const { data: matches } = await supabase
      .from("matches")
      .select("ladder_id, played_at, created_at")
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .eq("status", "Confirmed");

    const enrichedMemberships = (memberships || []).map((membership) => {
      const ladderMatches = (matches || []).filter(
        (m) => m.ladder_id === membership.ladder_id
      );

      // Find last played date
      let lastPlayed = null;
      if (ladderMatches.length > 0) {
        // Sort by date descending
        const sorted = [...ladderMatches].sort((a, b) => {
          const tA = new Date(a.played_at || a.created_at).getTime();
          const tB = new Date(b.played_at || b.created_at).getTime();
          return tB - tA;
        });
        lastPlayed = sorted[0].played_at || sorted[0].created_at;
      }

      return {
        ...membership,
        match_count: ladderMatches.length,
        last_played: lastPlayed,
      };
    });

    const active = enrichedMemberships.filter((m) => m.status === "active");
    const pending = enrichedMemberships.filter((m) => m.status === "pending");

    // Return all memberships + subsets for different consumers
    return NextResponse.json({
      memberships: enrichedMemberships,
      active,
      pending
    });
  } catch (error: any) {
    console.error("[GET /api/memberships] Exception:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}