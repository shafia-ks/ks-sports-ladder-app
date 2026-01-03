import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 } as ResponseInit);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("ladder_memberships")
      .select("user_id")
      .eq("status", "active");

    if (error) throw error;

    const totalMembers = new Set((data ?? []).map((row) => row.user_id)).size;

    return NextResponse.json({ totalMembers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 } as ResponseInit);
  }
}
