import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/supabase/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 } as ResponseInit);
  }

  try {
    const body = await req.json();
    const { role } = body;

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

    return NextResponse.json({ user: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 } as ResponseInit);
  }
}
