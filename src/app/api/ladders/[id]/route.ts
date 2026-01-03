import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 } as ResponseInit);
  }

  try {
    const { data: ladder, error: ladderError } = await supabaseAdmin
      .from("ladders")
      .select("id, name, description, sport_id, location, status, visibility, challenge_rules, ranking_rules, created_at, created_by")
      .eq("id", params.id)
      .maybeSingle();

    if (ladderError) {
      // If the ladder isn't found, return 404 rather than 500
      const msg = (ladderError.message || "").toLowerCase();
      if (!ladder && (msg.includes("not found") || msg.includes("no rows") || msg.includes("not exist"))) {
        return NextResponse.json({ error: "Ladder not found" }, { status: 404 } as ResponseInit);
      }
      throw ladderError;
    }
    if (!ladder) {
      return NextResponse.json({ error: "Ladder not found" }, { status: 404 } as ResponseInit);
    }

    const { data: members, error: membersError } = await supabaseAdmin
      .from("ladder_memberships")
      .select("id, user_id, current_rank, status, accepted_at, requested_at")
      .eq("ladder_id", params.id)
      .eq("status", "active")
      .order("current_rank", { ascending: true });

    if (membersError) throw membersError;

    let membersWithUsers = members ?? [];

    if (members && members.length > 0) {
      const userIds = members.map((m) => m.user_id);

      const { data: userProfiles, error: userProfilesError } = await supabaseAdmin
        .from("users")
        .select("id, full_name, first_name, last_name, email")
        .in("id", userIds);

      if (userProfilesError) throw userProfilesError;

      const userMap = new Map((userProfiles ?? []).map((u) => [u.id, u]));
      membersWithUsers = members.map((member) => ({
        ...member,
        users: userMap.get(member.user_id) ?? null,
      }));
    }

    return NextResponse.json({ ladder, members: membersWithUsers });
  } catch (error) {
    console.error(`GET /api/ladders/${params.id} error:`, error);
    return NextResponse.json({ error: "Failed to load ladder" }, { status: 500 } as ResponseInit);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 } as ResponseInit);
  }

  try {
    const body = await req.json();
    const { description, location, visibility, ranking_rules, challenge_rules } = body;

    const updates: Record<string, unknown> = {};
    if (description !== undefined) updates.description = description;
    if (location !== undefined) updates.location = location;
    if (visibility !== undefined) updates.visibility = visibility;
    if (ranking_rules !== undefined) updates.ranking_rules = ranking_rules;
    if (challenge_rules !== undefined) updates.challenge_rules = challenge_rules;

    const { data, error } = await supabaseAdmin
      .from("ladders")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ladder: data });
  } catch (error) {
    console.error(`PATCH /api/ladders/${params.id} error:`, error);
    return NextResponse.json({ error: "Failed to update ladder" }, { status: 500 } as ResponseInit);
  }
}