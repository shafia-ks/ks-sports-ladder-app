import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/supabase/audit";
import { createNotification } from "@/lib/supabase/notifications";

/**
 * Disable/deactivate a user (admin only)
 * Marks auth user's app_metadata.disabled = true
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

    // Set disabled flag in app metadata
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { disabled: true },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

      // Create audit log
      await createAuditLog({
        entityType: "user",
        entityId: userId,
        action: "User account disabled",
        performedBy: "admin",
      });

      // Notify user (they won't be able to log in to see it, but it's logged)
      await createNotification({
        userId: userId,
        type: "account_disabled",
        message: "Your account has been disabled. Please contact support for assistance.",
      });

    return NextResponse.json(
      { message: "User disabled successfully", user: data?.user },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error disabling user:", error);
    return NextResponse.json(
      { error: "Failed to disable user" },
      { status: 500 }
    );
  }
}
