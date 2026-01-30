import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; userId: string } }
) {
    try {
        const supabase = createClient();
        const { id: ladderId, userId } = params;

        // Get member tracking
        const { data: tracking, error } = await supabase
            .from("member_inactivity_tracking")
            .select("*")
            .eq("ladder_id", ladderId)
            .eq("user_id", userId)
            .single();

        if (error && error.code !== "PGRST116") {
            console.error("Error fetching member tracking:", error);
            return NextResponse.json({ error: "Failed to fetch tracking" }, { status: 500 });
        }

        // If no tracking exists, return null
        if (!tracking) {
            return NextResponse.json({ tracking: null }, { status: 200 });
        }

        return NextResponse.json({ tracking }, { status: 200 });
    } catch (error) {
        console.error("Error in GET /api/ladders/[id]/members/[userId]/inactivity:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
