import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_INACTIVITY_SETTINGS } from "@/types/inactivity";

export async function GET(
    request: NextRequest,
    { params }: { params: { ladderId: string } }
) {
    try {
        const supabase = createClient();
        const { ladderId } = params;

        // Get settings
        const { data: settings, error } = await supabase
            .from("ladder_inactivity_settings")
            .select("*")
            .eq("ladder_id", ladderId)
            .single();

        if (error && error.code !== "PGRST116") {
            // PGRST116 = not found
            console.error("Error fetching inactivity settings:", error);
            return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
        }

        // If no settings exist, return defaults
        if (!settings) {
            return NextResponse.json({ settings: null }, { status: 200 });
        }

        return NextResponse.json({ settings }, { status: 200 });
    } catch (error) {
        console.error("Error in GET /api/ladders/[ladderId]/inactivity-settings:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { ladderId: string } }
) {
    try {
        const supabase = createClient();
        const { ladderId } = params;

        // Check authentication
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is organizer or admin
        const { data: isOrganizer } = await supabase
            .from("ladder_leaders")
            .select("id")
            .eq("ladder_id", ladderId)
            .eq("user_id", user.id)
            .single();

        const { data: userData } = await supabase
            .from("users")
            .select("is_admin")
            .eq("id", user.id)
            .single();

        const isAdmin = userData?.is_admin || false;

        if (!isOrganizer && !isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get request body
        const body = await request.json();

        // Upsert settings
        const { data: settings, error } = await supabase
            .from("ladder_inactivity_settings")
            .upsert(
                {
                    ladder_id: ladderId,
                    ...body,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "ladder_id",
                }
            )
            .select()
            .single();

        if (error) {
            console.error("Error updating inactivity settings:", error);
            return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
        }

        return NextResponse.json({ settings }, { status: 200 });
    } catch (error) {
        console.error("Error in PUT /api/ladders/[ladderId]/inactivity-settings:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
