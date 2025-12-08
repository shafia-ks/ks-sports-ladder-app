import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/supabase/audit";
import { createNotification } from "@/lib/supabase/notifications";

const confirmSchema = z.object({
  matchId: z.string(),
  userId: z.string(),
});

const disputeSchema = z.object({
  matchId: z.string(),
  userId: z.string(),
  reason: z.string(),
});

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "confirm") {
    const json = await req.json();
    const parsed = confirmSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase env missing" }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("matches")
      .update({ status: "Confirmed", confirmed_by: parsed.data.userId })
      .eq("id", parsed.data.matchId)
      .select("player1_id, player2_id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await createAuditLog({
      entityType: "match",
      entityId: parsed.data.matchId,
      action: "Match confirmed",
      performedBy: parsed.data.userId,
    });

    const otherPlayer = data?.player1_id === parsed.data.userId ? data?.player2_id : data?.player1_id;
    await createNotification({
      userId: otherPlayer ?? "",
      type: "match_confirmed",
      message: `Match result confirmed`,
      link: `/matches/${parsed.data.matchId}`,
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "dispute") {
    const json = await req.json();
    const parsed = disputeSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase env missing" }, { status: 500 });
    }

    const { error } = await supabaseAdmin
      .from("matches")
      .update({ status: "Disputed", disputed_by: parsed.data.userId })
      .eq("id", parsed.data.matchId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await createAuditLog({
      entityType: "match",
      entityId: parsed.data.matchId,
      action: `Match disputed: ${parsed.data.reason}`,
      performedBy: parsed.data.userId,
    });

    // TODO: notify admin/organizer to resolve dispute
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
