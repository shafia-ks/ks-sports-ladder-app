import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function PATCH(
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
    const { status, admin_id } = body;

    if (!["active", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 } as ResponseInit
      );
    }

    const updateData: any = { status };
    if (status === "active") {
      updateData.accepted_at = new Date().toISOString();
      updateData.accepted_by = admin_id;
    }

    const { data, error } = await supabaseAdmin
      .from("ladder_memberships")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ membership: data });
  } catch (error) {
    console.error("PATCH /api/admin/pending-memberships/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update membership" },
      { status: 500 } as ResponseInit
    );
  }
}
