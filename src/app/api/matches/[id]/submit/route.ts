import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { set_scores, winner_id, played_at, location, status } = body;

        console.log("[PATCH /api/matches/:id/submit] Updating match:", params.id, body);

        // Update match
        const { data: match, error } = await supabaseAdmin
            .from("matches")
            .update({
                set_scores,
                winner_id,
                played_at: played_at || new Date().toISOString(),
                location,
                status: status || "Submitted",
            })
            .eq("id", params.id)
            .select()
            .single();

        if (error) {
            console.error("[PATCH /api/matches/:id/submit] Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log("[PATCH /api/matches/:id/submit] Match updated successfully");
        return NextResponse.json({ match });
    } catch (error: any) {
        console.error("[PATCH /api/matches/:id/submit] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
