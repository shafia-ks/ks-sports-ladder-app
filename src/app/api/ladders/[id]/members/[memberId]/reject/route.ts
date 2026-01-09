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

        console.log(`Rejecting member ${memberId} from ladder ${ladderId}`);

        // Remove/reject member
        const { error } = await supabaseAdmin
            .from("ladder_memberships")
            .delete()
            .eq("id", memberId)
            .eq("ladder_id", ladderId);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`POST /api/ladders/${params.id}/members/${params.memberId}/reject error:`, error);
        return NextResponse.json({ error: "Failed to reject member" }, { status: 500 });
    }
}
