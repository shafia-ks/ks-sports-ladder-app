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
  rules: z.object({
    maxPositionsUp: z.number().int().positive(),
    preventChallengingBusyPlayers: z.boolean(),
    maxActiveChallengesPerPlayer: z.number().int().positive(),
    expiryDays: z.number().int().positive(),
    cooldownHours: z.number().int().nonnegative().optional(),
  }),
});

export async function GET(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const ladderId = searchParams.get("ladderId");
  const userId = searchParams.get("userId");
  const statusParam = searchParams.get("status"); // Can be comma-separated: "Pending,Accepted"
  const limitParam = searchParams.get("limit");

  const limit = limitParam ? parseInt(limitParam, 10) : 100;

  let query = supabaseAdmin
    .from("challenges")
    .select(
      `id, ladder_id, challenger_id, challenged_id, status, scheduled_at, location, notes, 
       expires_at, created_at, cancellation_reason, cancelled_at, counter_proposal_time, 
       counter_proposal_location, counter_proposal_notes, accepted_at, declined_at, completed_at`
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (ladderId) {
    query = query.eq("ladder_id", ladderId);
  }

  if (userId) {
    query = query.or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`);
  }

  if (statusParam) {
    const statuses = statusParam.split(",").map(s => s.trim());
    if (statuses.length === 1) {
      query = query.eq("status", statuses[0]);
    } else {
      query = query.in("status", statuses);
    }
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with user data (Batch Optimized)
  if (data && data.length > 0) {
    const userIds = new Set<string>();
    data.forEach((c) => {
      if (c.challenger_id) userIds.add(c.challenger_id);
      if (c.challenged_id) userIds.add(c.challenged_id);
    });

    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, full_name, email, avatar_url")
      .in("id", Array.from(userIds));

    if (usersError) {
      console.error("Failed to fetch users for challenges:", usersError);
      // Fallback: return data without user details rather than crashing
      return NextResponse.json({ challenges: data });
    }

    const usersMap = new Map(users?.map((u) => [u.id, u]) || []);

    const challenges = data.map((challenge) => ({
      ...challenge,
      challenger: usersMap.get(challenge.challenger_id) || { id: challenge.challenger_id, full_name: 'Unknown', email: '' },
      challenged: usersMap.get(challenge.challenged_id) || { id: challenge.challenged_id, full_name: 'Unknown', email: '' },
    }));

    return NextResponse.json({ challenges });
  }

  return NextResponse.json({ challenges: [] });
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

  // Cooling period is handled by the database trigger (prevent_challenge_if_busy)
  // which checks ladder_memberships.cooling_expires_at

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parsed.data.rules.expiryDays);

  const { data, error } = await supabaseAdmin
    .from("challenges")
    .insert({
      ladder_id: parsed.data.ladderId,
      challenger_id: parsed.data.challengerId,
      challenged_id: parsed.data.challengedId,
      status: "Pending",
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    // Handle database trigger errors with user-friendly messages
    if (error.message.includes("Challenger is currently busy")) {
      return NextResponse.json({
        error: "You are currently busy with another challenge or match. Please complete it before creating a new challenge."
      }, { status: 422 });
    }
    if (error.message.includes("Challenged player is currently busy")) {
      return NextResponse.json({
        error: "This player is currently busy with another challenge or match. Please try again later."
      }, { status: 422 });
    }
    if (error.message.includes("cooling period")) {
      return NextResponse.json({
        error: "You or your opponent are in a cooling period. Please wait before challenging again."
      }, { status: 422 });
    }
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
    ladderName: ladderResult.data?.name ?? "Unknown Ladder",
  });

  return NextResponse.json({ ok: true, message: "Challenge created", challengeId: data?.id });
}
