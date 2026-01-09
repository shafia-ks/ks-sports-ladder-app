import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string; memberId: string } }
) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
    }

    try {
        const ladderId = params.id;
        const memberId = params.memberId;

        // Get current max rank (excluding rank 0 which is for pending members)
        const { data: ranks } = await supabaseAdmin
            .from("ladder_memberships")
            .select("current_rank")
            .eq("ladder_id", ladderId)
            .eq("status", "active")
            .gt("current_rank", 0)
            .order("current_rank", { ascending: false })
            .limit(1);

        const nextRank = (ranks?.[0]?.current_rank ?? 0) + 1;

        console.log(`Approving member ${memberId}: current max rank = ${ranks?.[0]?.current_rank}, assigning rank ${nextRank}`);

        // Accept member
        const { data, error } = await supabaseAdmin
            .from("ladder_memberships")
            .update({
                status: "active",
                current_rank: nextRank,
                accepted_at: new Date().toISOString(),
            })
            .eq("id", memberId)
            .eq("ladder_id", ladderId)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error(`POST /api/ladders/${params.id}/members/${params.memberId}/approve error:`, error);
        return NextResponse.json({ error: "Failed to approve member" }, { status: 500 });
    }
}
