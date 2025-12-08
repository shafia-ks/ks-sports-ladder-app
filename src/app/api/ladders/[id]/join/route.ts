import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { user_id } = body;

    // Check if already a member
    const { data: existing } = await supabaseAdmin
      .from("ladder_memberships")
      .select("id")
      .eq("ladder_id", params.id)
      .eq("user_id", user_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Already a member or pending" },
        { status: 400 }
      );
    }

    // Create pending membership
    const { data, error } = await supabaseAdmin
      .from("ladder_memberships")
      .insert({
        ladder_id: params.id,
        user_id,
        status: "pending",
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(`POST /api/ladders/${params.id}/join error:`, error);
    return NextResponse.json({ error: "Failed to join ladder" }, { status: 500 });
  }
}
