import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase env vars missing" },
      { status: 500 } as ResponseInit
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "email parameter required" },
        { status: 400 } as ResponseInit
      );
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role")
      .eq("email", email)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 } as ResponseInit
      );
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error("GET /api/users/by-email error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 } as ResponseInit
    );
  }
}
