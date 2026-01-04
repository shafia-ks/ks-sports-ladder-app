import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase env vars missing" },
      { status: 500 } as ResponseInit
    );
  }

  try {
    const { id } = params;

    // Get all organizers for this ladder
    const { data, error } = await supabaseAdmin
      .from("ladder_leaders")
      .select(
        `
        id,
        user_id,
        created_at,
        users ( id, email, full_name )
      `
      )
      .eq("ladder_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ organizers: data ?? [] });
  } catch (error) {
    console.error("GET /api/ladders/[id]/organizers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizers" },
      { status: 500 } as ResponseInit
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase env vars missing" },
      { status: 500 } as ResponseInit
    );
  }

  try {
    const { id } = params;
    const body = await req.json();
    const { user_id, requested_by } = body;

    if (!user_id || !requested_by) {
      return NextResponse.json(
        { error: "user_id and requested_by required" },
        { status: 400 } as ResponseInit
      );
    }

    // Verify requester is organizer or admin
    const { data: requester } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", requested_by)
      .single();

    if (requester?.role === "organizer") {
      // Verify they're an organizer of this ladder
      const { data: isLeader } = await supabaseAdmin
        .from("ladder_leaders")
        .select("id")
        .eq("ladder_id", id)
        .eq("user_id", requested_by)
        .single();

      if (!isLeader) {
        return NextResponse.json(
          { error: "You must be an organizer of this ladder" },
          { status: 403 } as ResponseInit
        );
      }
    } else if (requester?.role !== "admin") {
      return NextResponse.json(
        { error: "Only organizers and admins can add organizers" },
        { status: 403 } as ResponseInit
      );
    }

    // Check if already an organizer
    const { data: existing } = await supabaseAdmin
      .from("ladder_leaders")
      .select("id")
      .eq("ladder_id", id)
      .eq("user_id", user_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "User is already an organizer for this ladder" },
        { status: 400 } as ResponseInit
      );
    }

    // Add as organizer
    const { data, error } = await supabaseAdmin
      .from("ladder_leaders")
      .insert({
        ladder_id: id,
        user_id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { organizer: data, message: "Organizer added successfully" },
      { status: 201 } as ResponseInit
    );
  } catch (error) {
    console.error("POST /api/ladders/[id]/organizers error:", error);
    return NextResponse.json(
      { error: "Failed to add organizer" },
      { status: 500 } as ResponseInit
    );
  }
}
