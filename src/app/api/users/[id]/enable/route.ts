import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/supabase/audit";

/**
 * Enable/reactivate a user (admin only)
 * Marks auth user's app_metadata.disabled = false
 */
export async function PATCH(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
    }

    try {
        const userId = params.id;

        // Remove disabled flag from app metadata
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            app_metadata: { disabled: false },
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Create audit log
        await createAuditLog({
            entityType: "user",
            entityId: userId,
            action: "User account enabled",
            performedBy: "admin",
        });

        return NextResponse.json(
            { message: "User enabled successfully", user: data?.user },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error enabling user:", error);
        return NextResponse.json(
            { error: "Failed to enable user" },
            { status: 500 }
        );
    }
}
