import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

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
