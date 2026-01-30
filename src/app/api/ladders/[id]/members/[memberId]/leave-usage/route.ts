import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; memberId: string } }
) {
    try {
        const supabase = createClient();
        const { id: ladderId, memberId: userId } = params;

        // Get leave usage for current year
        const currentYear = new Date().getFullYear();
        const { data: leaveHistory, error } = await supabase
            .from("member_leave_history")
            .select("leave_type")
            .eq("ladder_id", ladderId)
            .eq("user_id", userId)
            .gte("started_at", `${currentYear}-01-01`)
            .lte("started_at", `${currentYear}-12-31`);

        if (error) {
            console.error("Error fetching leave usage:", error);
            return NextResponse.json({ error: "Failed to fetch leave usage" }, { status: 500 });
        }

        // Count by type
        const usage = {
            vacation: leaveHistory?.filter((l) => l.leave_type === "vacation").length || 0,
            injury: leaveHistory?.filter((l) => l.leave_type === "injury").length || 0,
            work_travel: leaveHistory?.filter((l) => l.leave_type === "work_travel").length || 0,
            personal: leaveHistory?.filter((l) => l.leave_type === "personal").length || 0,
        };

        return NextResponse.json({ usage }, { status: 200 });
    } catch (error) {
        console.error("Error in GET /api/ladders/[id]/members/[memberId]/leave-usage:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
