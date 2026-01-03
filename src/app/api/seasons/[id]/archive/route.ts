import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/supabase/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 } as ResponseInit);
  }

  try {
    // Get current rankings before archiving
    const { data: season } = await supabaseAdmin
      .from("seasons")
      .select("ladder_id, name")
      .eq("id", params.id)
      .single();

    if (season) {
      const { data: rankings } = await supabaseAdmin
        .from("ladder_memberships")
        .select("user_id, current_rank")
        .eq("ladder_id", season.ladder_id)
        .eq("status", "active")
        .order("current_rank", { ascending: true });

      // Create a ranking snapshot
      await supabaseAdmin
        .from("ranking_history")
        .insert({
          ladder_id: season.ladder_id,
          snapshot: rankings || [],
          match_id: null,
        });
    }

    // Archive the season
    const { data, error } = await supabaseAdmin
      .from("seasons")
      .update({ archived: true })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    await createAuditLog({
      entityType: "season",
      entityId: params.id,
      action: `Season archived: ${season?.name}`,
      performedBy: "system",
    });

    return NextResponse.json({ season: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 } as ResponseInit);
  }
}
