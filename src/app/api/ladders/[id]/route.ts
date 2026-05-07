import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 } as ResponseInit);
  }

  // Try to get user ID from custom header (sent by client)
  const userId = req.headers.get("x-user-id");

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

    // Ladder organizers
    const { data: organizerRows, error: organizersError } = await supabaseAdmin
      .from("ladder_leaders")
      .select("user_id")
      .eq("ladder_id", params.id);

    if (organizersError) throw organizersError;

    const organizerIds = (organizerRows ?? []).map((row) => row.user_id);

    // Fetch organizer user details
    let organizers: any[] = [];
    if (organizerIds.length > 0) {
      const { data: organizerUsers, error: organizerUsersError } = await supabaseAdmin
        .from("users")
        .select("id, full_name, first_name, last_name, email, role, avatar_url")
        .in("id", organizerIds);

      if (organizerUsersError) throw organizerUsersError;
      organizers = organizerUsers ?? [];
    }

    // Check if user is a member of this ladder or privileged
    let userRole = "player";
    let membership: { id: string; status: string } | null = null;

    if (userId) {
      const { data: userProfile } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      userRole = userProfile?.role || "player";

      const { data: membershipRow } = await supabaseAdmin
        .from("ladder_memberships")
        .select("id, status")
        .eq("ladder_id", params.id)
        .eq("user_id", userId)
        .maybeSingle();

      membership = membershipRow ?? null;
    }

    const isOrganizer = userId ? organizerIds.includes(userId) : false;
    const isPrivileged = userRole === "admin" || (userRole === "organizer" && isOrganizer);
    const isMember = !!membership;
    const canSeeMembers = isMember || isPrivileged;

    // Only return member list if user is allowed
    let membersWithUsers: any[] = [];

    if (canSeeMembers) {
      const { data: members, error: membersError } = await supabaseAdmin
        .from("ladder_memberships")
        .select("id, user_id, current_rank, previous_rank, status, accepted_at, requested_at, cooling_expires_at")
        .eq("ladder_id", params.id)
        .in("status", ["active", "pending"])
        .order("status", { ascending: false })
        .order("current_rank", { ascending: true });

      if (membersError) throw membersError;

      if (members && members.length > 0) {
        // Fetch user data for ALL members (active AND pending)
        const allUserIds = members.map((m) => m.user_id);

        if (allUserIds.length > 0) {
          const { data: userProfiles, error: userProfilesError } = await supabaseAdmin
            .from("users")
            .select("id, full_name, first_name, last_name, email, role, avatar_url")
            .in("id", allUserIds);

          if (userProfilesError) throw userProfilesError;

          // Fetch active challenges, matches, and leave status in parallel
          const [{ data: activeChallenges }, { data: activeMatches }, { data: leaveTracking }] = await Promise.all([
            supabaseAdmin
              .from("challenges")
              .select("challenger_id, challenged_id")
              .eq("ladder_id", params.id)
              .in("status", ["Pending", "Accepted"]),
            supabaseAdmin
              .from("matches")
              .select("player1_id, player2_id")
              .eq("ladder_id", params.id)
              .in("status", ["Pending", "Submitted"]),
            supabaseAdmin
              .from("member_inactivity_tracking")
              .select("user_id, on_leave, leave_type")
              .eq("ladder_id", params.id)
              .eq("on_leave", true)
              .in("user_id", allUserIds),
          ]);

          const busyUserIds = new Set<string>();
          activeChallenges?.forEach(c => {
            busyUserIds.add(c.challenger_id);
            busyUserIds.add(c.challenged_id);
          });
          activeMatches?.forEach(m => {
            busyUserIds.add(m.player1_id);
            busyUserIds.add(m.player2_id);
          });

          const leaveMap = new Map(
            (leaveTracking ?? []).map((t) => [t.user_id, t.leave_type as string])
          );

          const userMap = new Map((userProfiles ?? []).map((u) => [u.id, u]));
          const now = new Date();

          membersWithUsers = members.map((member) => {
            const coolingUntil = member.cooling_expires_at ? new Date(member.cooling_expires_at) : null;
            const isCooling = coolingUntil && coolingUntil > now;
            const leaveType = leaveMap.get(member.user_id) ?? null;

            return {
              ...member,
              users: userMap.get(member.user_id) ?? null,
              is_busy: busyUserIds.has(member.user_id) || isCooling,
              on_leave: leaveType !== null,
              leave_type: leaveType,
            };
          });
        }
      }
    }

    // Counts for public insights
    const [activeCountRes, pendingCountRes] = await Promise.all([
      supabaseAdmin
        .from("ladder_memberships")
        .select("id", { count: "exact", head: true })
        .eq("ladder_id", params.id)
        .eq("status", "active"),
      supabaseAdmin
        .from("ladder_memberships")
        .select("id", { count: "exact", head: true })
        .eq("ladder_id", params.id)
        .eq("status", "pending"),
    ]);

    if (activeCountRes.error) throw activeCountRes.error;
    if (pendingCountRes.error) throw pendingCountRes.error;

    const { count: activeChallengesCount, error: activeChallengesError } = await supabaseAdmin
      .from("challenges")
      .select("id", { count: "exact", head: true })
      .eq("ladder_id", params.id)
      .in("status", ["Pending", "Accepted"]);

    if (activeChallengesError) throw activeChallengesError;

    const { count: confirmedMatchesCount, error: confirmedMatchesError } = await supabaseAdmin
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("ladder_id", params.id)
      .eq("status", "Confirmed");

    if (confirmedMatchesError) throw confirmedMatchesError;

    return NextResponse.json({
      ladder,
      members: membersWithUsers,
      organizerIds,
      organizers,
      memberCounts: {
        active: activeCountRes.count || 0,
        pending: pendingCountRes.count || 0,
      },
      challengeCounts: {
        active: activeChallengesCount || 0,
      },
      matchCounts: {
        confirmed: confirmedMatchesCount || 0,
      },
    });
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
    if (body.status !== undefined) updates.status = body.status;

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