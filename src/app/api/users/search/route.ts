import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: Request) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
        return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
    }

    try {
        // Search users by name or email
        const { data, error } = await supabaseAdmin
            .from("users")
            .select("id, full_name, first_name, last_name, email")
            .or(`full_name.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(10);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ users: data || [] });
    } catch (error) {
        console.error("User search error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
