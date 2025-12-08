import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/supabase/audit";
import { createNotification } from "@/lib/supabase/notifications";

const acceptSchema = z.object({
  challengeId: z.string(),
  userId: z.string(),
  scheduledDateTime: z.string().optional(),
  location: z.string().optional(),
});

const declineSchema = z.object({
  challengeId: z.string(),
  userId: z.string(),
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "accept") {
    const json = await req.json();
    const parsed = acceptSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase env missing" }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("challenges")
      .update({
        status: "Accepted",
        scheduled_at: parsed.data.scheduledDateTime ?? null,
        location: parsed.data.location ?? null,
      })
      .eq("id", parsed.data.challengeId)
      .select("challenger_id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await createAuditLog({
      entityType: "challenge",
      entityId: parsed.data.challengeId,
      action: "Challenge accepted",
      performedBy: parsed.data.userId,
    });

    await createNotification({
      userId: data?.challenger_id ?? "",
      type: "challenge_accepted",
      message: `Your challenge was accepted`,
      link: `/challenges/${parsed.data.challengeId}`,
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "decline") {
    const json = await req.json();
    const parsed = declineSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase env missing" }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("challenges")
      .update({ status: "Declined" })
      .eq("id", parsed.data.challengeId)
      .select("challenger_id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await createAuditLog({
      entityType: "challenge",
      entityId: parsed.data.challengeId,
      action: `Challenge declined: ${parsed.data.reason ?? "no reason"}`,
      performedBy: parsed.data.userId,
    });

    await createNotification({
      userId: data?.challenger_id ?? "",
      type: "challenge_declined",
      message: `Your challenge was declined`,
      link: `/challenges/${parsed.data.challengeId}`,
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
