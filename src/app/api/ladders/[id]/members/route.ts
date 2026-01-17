import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// Accept a pending member
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { member_id, action } = body; // action: "accept" | "decline" | "remove"

    if (action === "accept") {
      // Get member info
      const { data: memberInfo } = await supabaseAdmin
        .from("ladder_memberships")
        .select("user_id, users(full_name, email)")
        .eq("id", member_id)
        .single();

      // Get ladder info
      const { data: ladderData } = await supabaseAdmin
        .from("ladders")
        .select("name")
        .eq("id", params.id)
        .single();

      // Get current max rank (excluding rank 0 which is for pending members)
      const { data: ranks } = await supabaseAdmin
        .from("ladder_memberships")
        .select("current_rank")
        .eq("ladder_id", params.id)
        .eq("status", "active")
        .gt("current_rank", 0)
        .order("current_rank", { ascending: false })
        .limit(1);

      const nextRank = (ranks?.[0]?.current_rank ?? 0) + 1;

      console.log(`Accepting member ${member_id}: current max rank = ${ranks?.[0]?.current_rank}, assigning rank ${nextRank}`);

      // Accept member
      const { data, error } = await supabaseAdmin
        .from("ladder_memberships")
        .update({
          status: "active",
          current_rank: nextRank,
          accepted_at: new Date().toISOString(),
        })
        .eq("id", member_id)
        .select()
        .single();

      if (error) throw error;

      // Create membership event for activity feed
      if (memberInfo) {
        await supabaseAdmin
          .from("membership_events")
          .insert({
            ladder_id: params.id,
            user_id: memberInfo.user_id,
            event_type: "joined",
          });
      }

      // Notify all other active members about the new joiner
      if (memberInfo && ladderData) {
        const { createNotification } = await import("@/lib/supabase/notifications");

        // Get all active members except the new one
        const { data: activeMembers } = await supabaseAdmin
          .from("ladder_memberships")
          .select("user_id")
          .eq("ladder_id", params.id)
          .eq("status", "active")
          .neq("user_id", memberInfo.user_id);

        const memberName = (memberInfo.users as any)?.full_name || (memberInfo.users as any)?.email || "A new member";
        if (activeMembers) {
          for (const member of activeMembers) {
            await createNotification({
              userId: member.user_id,
              type: "membership_added",
              message: `${memberName} joined ${ladderData.name}`,
              link: `/ladders/${params.id}`,
            });
          }
        }
      }

      return NextResponse.json(data);
    }

    if (action === "decline" || action === "remove") {
      // Get member info before deleting
      const { data: memberData } = await supabaseAdmin
        .from("ladder_memberships")
        .select("user_id, users(full_name, email)")
        .eq("id", member_id)
        .single();

      // Get ladder info
      const { data: ladderData } = await supabaseAdmin
        .from("ladders")
        .select("name")
        .eq("id", params.id)
        .single();

      // Remove/reject member
      const { error } = await supabaseAdmin
        .from("ladder_memberships")
        .delete()
        .eq("id", member_id);

      if (error) throw error;

      // Create membership event for activity feed
      if (action === "remove" && memberData) {
        await supabaseAdmin
          .from("membership_events")
          .insert({
            ladder_id: params.id,
            user_id: memberData.user_id,
            event_type: "left",
          });
      }

      // If this was a "remove" (leave), notify all other active members AND clean up pending items
      if (action === "remove" && memberData && ladderData) {
        const userId = memberData.user_id;

        // 1. Cancel pending challenges
        await supabaseAdmin
          .from("challenges")
          .update({ status: "cancelled" })
          .eq("ladder_id", params.id)
          .eq("status", "pending")
          .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`);

        // 2. Cancel pending matches
        // includes 'Pending' (scheduled/unplayed) and 'ScoreSubmitted' (waiting confirm)
        await supabaseAdmin
          .from("matches")
          .update({ status: "Cancelled" })
          .eq("ladder_id", params.id)
          .in("status", ["Pending", "ScoreSubmitted"])
          .or(`player1_id.eq.${userId},player2_id.eq.${userId}`);

        const { createNotification } = await import("@/lib/supabase/notifications");

        // Get all active members except the one who left
        const { data: activeMembers } = await supabaseAdmin
          .from("ladder_memberships")
          .select("user_id")
          .eq("ladder_id", params.id)
          .eq("status", "active")
          .neq("user_id", userId);

        // Notify each member
        const memberName = (memberData.users as any)?.full_name || (memberData.users as any)?.email || "A member";
        if (activeMembers) {
          for (const member of activeMembers) {
            await createNotification({
              userId: member.user_id,
              type: "membership_removed",
              message: `${memberName} left ${ladderData.name}`,
              link: `/ladders/${params.id}`,
            });
          }
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error(`POST /api/ladders/${params.id}/members error:`, error);
    return NextResponse.json({ error: "Failed to manage member" }, { status: 500 });
  }
}
