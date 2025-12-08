import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// Accept a pending member
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { member_id, action } = body; // action: "accept" | "decline" | "remove"

    if (action === "accept") {
      // Get current max rank
      const { data: ranks } = await supabaseAdmin
        .from("ladder_memberships")
        .select("current_rank")
        .eq("ladder_id", params.id)
        .eq("status", "active")
        .order("current_rank", { ascending: false })
        .limit(1);

      const nextRank = (ranks?.[0]?.current_rank ?? 0) + 1;

      // Accept member
      const { data, error } = await supabaseAdmin
        .from("ladder_memberships")
        .update({
          status: "active",
          current_rank: nextRank,
          accepted_at: new Date().toISOString(),
        })
        .eq("id", member_id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    if (action === "decline" || action === "remove") {
      // Remove/reject member
      const { error } = await supabaseAdmin
        .from("ladder_memberships")
        .delete()
        .eq("id", member_id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error(`POST /api/ladders/${params.id}/members error:`, error);
    return NextResponse.json({ error: "Failed to manage member" }, { status: 500 });
  }
}
