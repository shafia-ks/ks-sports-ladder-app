import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
    request: NextRequest,
    { params }: { params: { ladderId: string; userId: string } }
) {
    try {
        const supabase = createClient();
        const { ladderId, userId } = params;

        // Check authentication
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only the user themselves can toggle their leave
        if (user.id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get request body
        const body = await request.json();
        const { on_leave, leave_type, reason } = body;

        if (on_leave) {
            // Going on leave - check usage limits
            const { data: settings } = await supabase
                .from("ladder_inactivity_settings")
                .select("*")
                .eq("ladder_id", ladderId)
                .single();

            if (!settings?.leave_system_enabled) {
                return NextResponse.json(
                    { error: "Leave system is not enabled for this ladder" },
                    { status: 400 }
                );
            }

            if (!leave_type) {
                return NextResponse.json({ error: "Leave type is required" }, { status: 400 });
            }

            // Check usage for current year
            const currentYear = new Date().getFullYear();
            const { data: leaveHistory } = await supabase
                .from("member_leave_history")
                .select("leave_type")
                .eq("ladder_id", ladderId)
                .eq("user_id", userId)
                .gte("started_at", `${currentYear}-01-01`)
                .lte("started_at", `${currentYear}-12-31`);

            const usageThisYear = leaveHistory?.filter((l) => l.leave_type === leave_type).length || 0;

            // Get max allowed for this leave type
            const maxAllowedMap: Record<string, number> = {
                vacation: settings.max_vacation_leaves_per_year,
                injury: settings.max_injury_leaves_per_year,
                work_travel: settings.max_work_leaves_per_year,
                personal: settings.max_personal_leaves_per_year,
            };

            const maxAllowed = maxAllowedMap[leave_type] || 0;

            if (usageThisYear >= maxAllowed) {
                return NextResponse.json(
                    { error: `You've used all ${maxAllowed} ${leave_type} leaves this year` },
                    { status: 400 }
                );
            }

            // Activate leave
            const { data: tracking, error: updateError } = await supabase
                .from("member_inactivity_tracking")
                .update({
                    on_leave: true,
                    leave_type,
                    leave_started_at: new Date().toISOString(),
                    leave_reason: reason || null,
                })
                .eq("ladder_id", ladderId)
                .eq("user_id", userId)
                .select()
                .single();

            if (updateError) {
                console.error("Error activating leave:", updateError);
                return NextResponse.json({ error: "Failed to activate leave" }, { status: 500 });
            }

            // Log in history
            await supabase.from("member_leave_history").insert({
                ladder_id: ladderId,
                user_id: userId,
                leave_type,
                started_at: new Date().toISOString(),
                reason: reason || null,
            });

            return NextResponse.json({ tracking }, { status: 200 });
        } else {
            // Returning from leave
            const { data: currentTracking } = await supabase
                .from("member_inactivity_tracking")
                .select("leave_started_at")
                .eq("ladder_id", ladderId)
                .eq("user_id", userId)
                .single();

            // Deactivate leave
            const { data: tracking, error: updateError } = await supabase
                .from("member_inactivity_tracking")
                .update({
                    on_leave: false,
                    leave_type: null,
                    leave_started_at: null,
                    leave_reason: null,
                })
                .eq("ladder_id", ladderId)
                .eq("user_id", userId)
                .select()
                .single();

            if (updateError) {
                console.error("Error deactivating leave:", updateError);
                return NextResponse.json({ error: "Failed to deactivate leave" }, { status: 500 });
            }

            // Update history with end date
            if (currentTracking?.leave_started_at) {
                await supabase
                    .from("member_leave_history")
                    .update({ ended_at: new Date().toISOString() })
                    .eq("ladder_id", ladderId)
                    .eq("user_id", userId)
                    .eq("started_at", currentTracking.leave_started_at)
                    .is("ended_at", null);
            }

            return NextResponse.json({ tracking }, { status: 200 });
        }
    } catch (error) {
        console.error("Error in POST /api/ladders/[ladderId]/members/[userId]/leave:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
