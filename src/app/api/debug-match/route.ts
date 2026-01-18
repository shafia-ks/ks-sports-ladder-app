import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        if (!supabaseAdmin) return NextResponse.json({ error: "no admin" }, { status: 500 });

        // Fetch matches with player names to identify
        const { data: matches, error } = await supabaseAdmin
            .from("matches")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(10);

        if (error) return NextResponse.json({ error });

        return NextResponse.json({ matches });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
