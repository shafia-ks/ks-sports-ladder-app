import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/supabase/audit";
import { createNotification } from "@/lib/supabase/notifications";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 } as ResponseInit);
  }

  try {
    const body = await req.json();
    const { role, confirmEmail } = body;

    // Handle email confirmation
    if (confirmEmail) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(params.id, {
        email_confirm: true,
      });

      if (authError) throw authError;

      await createAuditLog({
        entityType: "user",
        entityId: params.id,
        action: "Email confirmed by admin",
        performedBy: "admin",
      });

      return NextResponse.json({ success: true, message: "Email confirmed" });
    }

    // Handle role change
    if (role) {
      if (!["player", "organizer", "admin"].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 } as ResponseInit);
      }

      const { data, error } = await supabaseAdmin
        .from("users")
        .update({ role })
        .eq("id", params.id)
        .select()
        .single();

      if (error) throw error;

      await createAuditLog({
        entityType: "user",
        entityId: params.id,
        action: `Role changed to ${role}`,
        performedBy: params.id, // In production, get from auth context
      });

      // Notify user of role change
      await createNotification({
        userId: params.id,
        type: "role_changed",
        message: `Your role has been updated to ${role}`,
        link: role === "admin" ? "/admin" : role === "organizer" ? "/organizer" : "/dashboard",
      });

      return NextResponse.json({ user: data });
    }

    return NextResponse.json({ error: "No action specified" }, { status: 400 } as ResponseInit);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 } as ResponseInit);
  }
}

/**
 * DELETE - Permanently delete user account and all associated data
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 } as ResponseInit);
  }

  try {
    const userId = params.id;

    await createAuditLog({
      entityType: "user",
      entityId: userId,
      action: "User account permanently deleted",
      performedBy: "admin",
    });

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) throw authError;

    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 } as ResponseInit);
  }
}
