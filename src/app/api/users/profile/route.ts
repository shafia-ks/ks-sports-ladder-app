import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase env vars missing" },
      { status: 500 } as ResponseInit
    );
  }

  try {
    // Try to get user from Authorization header first
    const authHeader = req.headers.get("authorization");
    let user: any = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const {
        data: { user: authUser },
      } = await supabaseAdmin.auth.getUser(token);
      user = authUser;
    }

    // Fallback: try to extract from request (for Supabase managed tokens)
    if (!user) {
      const {
        data: { user: reqUser },
      } = await supabaseAdmin.auth.admin.getUserById(
        req.headers.get("x-user-id") || ""
      );
      user = reqUser;
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - no user found" },
        { status: 401 } as ResponseInit
      );
    }

    const body = await req.json();
    const { first_name, last_name, full_name } = body;

    const { data, error } = await supabaseAdmin
      .from("users")
      .update({
        first_name: first_name || null,
        last_name: last_name || null,
        full_name: full_name || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error("PATCH /api/users/profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 } as ResponseInit
    );
  }
}
