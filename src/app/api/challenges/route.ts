import { NextResponse } from "next/server";
import { z } from "zod";
import { validateChallenge } from "@/lib/challenges/validation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/supabase/audit";
import { notifyChallenge } from "@/lib/supabase/notifications";

const challengeInput = z.object({
  ladderId: z.string(),
  challengerId: z.string(),
  challengedId: z.string(),
  challengerRank: z.number().int().positive(),
  challengedRank: z.number().int().positive(),
  challengerActiveChallenges: z.number().int().nonnegative(),
  challengedActiveChallenges: z.number().int().nonnegative(),
  challengerBusy: z.boolean(),
  challengedBusy: z.boolean(),
  scheduledDateTime: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  rules: z.object({
    maxPositionsUp: z.number().int().positive(),
    preventChallengingBusyPlayers: z.boolean(),
    maxActiveChallengesPerPlayer: z.number().int().positive(),
    expiryDays: z.number().int().positive(),
  }),
});

export async function GET(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const ladderId = searchParams.get("ladderId");
  const userId = searchParams.get("userId");

  let query = supabaseAdmin
    .from("challenges")
    .select(
      `id, ladder_id, challenger_id, challenged_id, status, scheduled_at, location, notes, 
       expires_at, created_at, cancellation_reason, cancelled_at, counter_proposal_time, 
       counter_proposal_location, counter_proposal_notes, accepted_at, declined_at, completed_at`
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (ladderId) {
    query = query.eq("ladder_id", ladderId);
  }

  if (userId) {
    query = query.or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with user data
  if (!supabaseAdmin) {
    return NextResponse.json({ challenges: data ?? [] });
  }

  const challenges = await Promise.all(
    (data || []).map(async (challenge) => {
      const [challenger, challenged] = await Promise.all([
        supabaseAdmin!
          .from("users")
          .select("id, full_name, email")
          .eq("id", challenge.challenger_id)
          .single(),
        supabaseAdmin!
          .from("users")
          .select("id, full_name, email")
          .eq("id", challenge.challenged_id)
          .single(),
      ]);

      return {
        ...challenge,
        challenger: challenger.data,
        challenged: challenged.data,
      };
    })
  );

  return NextResponse.json({ challenges });
}

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = challengeInput.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
  }

  const errors = validateChallenge(parsed.data);
  if (errors.length) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parsed.data.rules.expiryDays);

  const { data, error } = await supabaseAdmin
    .from("challenges")
    .insert({
      ladder_id: parsed.data.ladderId,
      challenger_id: parsed.data.challengerId,
      challenged_id: parsed.data.challengedId,
      status: "Pending",
      scheduled_at: parsed.data.scheduledDateTime ?? null,
      location: parsed.data.location ?? null,
      notes: parsed.data.notes ?? null,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit log
  await createAuditLog({
    entityType: "challenge",
    entityId: data?.id ?? "",
    action: "Challenge created",
    performedBy: parsed.data.challengerId,
  });

  // Notify challenged player
  const ladderResult = await supabaseAdmin.from("ladders").select("name").eq("id", parsed.data.ladderId).single();
  await notifyChallenge({
    challengedId: parsed.data.challengedId,
    challengerId: parsed.data.challengerId,
    challengeId: data?.id ?? "",
    ladderName: ladderResult.data?.name ?? "Unknown Ladder",
  });

  return NextResponse.json({ ok: true, message: "Challenge created", challengeId: data?.id });
}
