import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
        return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    try {
        const supabase = createClient();
        const actions: any[] = [];
        const userIds = new Set<string>();

        // 1. Get pending challenges (Raw)
        const { data: challenges, error: challengesError } = await supabase
            .from("challenges")
            .select(`
                id,
                challenger_id,
                challenged_id,
                ladder_id,
                status,
                expires_at,
                ladders (name)
            `)
            .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
            .eq("status", "Pending");

        if (challengesError) throw challengesError;

        // Collect challenge user IDs
        challenges?.forEach(c => {
            if (c.challenger_id) userIds.add(c.challenger_id);
            if (c.challenged_id) userIds.add(c.challenged_id);
        });

        // 2. Get matches awaiting score confirmation (Raw)
        const { data: matches, error: matchesError } = await supabase
            .from("matches")
            .select(`
                id,
                player1_id,
                player2_id,
                ladder_id,
                status,
                submitted_by,
                ladders (name)
            `)
            .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
            .eq("status", "ScoreSubmitted");

        if (matchesError) throw matchesError;

        // Collect match user IDs
        matches?.forEach(m => {
            if (m.player1_id) userIds.add(m.player1_id);
            if (m.player2_id) userIds.add(m.player2_id);
        });

        // 3. Get matches awaiting score submission (Raw)
        const { data: pendingMatches, error: pendingError } = await supabase
            .from("matches")
            .select(`
                id,
                player1_id,
                player2_id,
                ladder_id,
                status,
                ladders (name)
            `)
            .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
            .eq("status", "Pending");

        if (pendingError) throw pendingError;

        // Collect pending match user IDs
        pendingMatches?.forEach(m => {
            if (m.player1_id) userIds.add(m.player1_id);
            if (m.player2_id) userIds.add(m.player2_id);
        });

        // 4. Get pending member approvals for ladders user organizes (ORGANIZER ACTIONS)
        const { data: organizedLadders } = await supabase
            .from("ladder_leaders")
            .select("ladder_id")
            .eq("user_id", userId);


        const organizedLadderIds = organizedLadders?.map(l => l.ladder_id) || [];

        let pendingMemberApprovals: any[] = [];
        if (organizedLadderIds.length > 0) {
            const { data: pendingApprovals } = await supabase
                .from("ladder_memberships")
                .select(`
                    id,
                    user_id,
                    ladder_id,
                    requested_at,
                    ladders (name)
                `)
                .in("ladder_id", organizedLadderIds)
                .eq("status", "pending");

            pendingApprovals?.forEach(approval => {
                if (approval.user_id) userIds.add(approval.user_id);
            });

            pendingMemberApprovals = pendingApprovals || [];
        }

        // 5. Get pending organizer requests for ladders user organizes (ORGANIZER ACTIONS)
        let pendingOrganizerRequests: any[] = [];
        if (organizedLadderIds.length > 0) {
            const { data: orgRequests } = await supabase
                .from("leader_requests")
                .select(`
                    id,
                    user_id,
                    ladder_id,
                    created_at,
                    ladders (name)
                `)
                .in("ladder_id", organizedLadderIds)
                .eq("status", "pending");

            orgRequests?.forEach(req => {
                if (req.user_id) userIds.add(req.user_id);
            });

            pendingOrganizerRequests = orgRequests || [];
        }

        // 6. Fetch Users manually
        const { data: users } = await supabase
            .from("users")
            .select("id, full_name, first_name, last_name, email")
            .in("id", Array.from(userIds));

        const userMap = new Map(users?.map(u => [u.id, u]) || []);

        // 7. Build Actions List

        // Challenges
        if (challenges) {
            for (const challenge of challenges) {
                if (challenge.challenged_id === userId) {
                    const challenger = userMap.get(challenge.challenger_id);
                    actions.push({
                        id: challenge.id,
                        type: "challenge",
                        ladder_id: challenge.ladder_id,
                        ladder_name: (challenge.ladders as any)?.name || "Unknown Ladder",
                        opponent_name: challenger?.full_name || challenger?.email || "Unknown",
                        expires_at: challenge.expires_at,
                        status: challenge.status,
                    });
                }
            }
        }

        // Matches Confirm
        if (matches) {
            for (const match of matches) {
                if (match.submitted_by !== userId) {
                    const player1 = userMap.get(match.player1_id);
                    const player2 = userMap.get(match.player2_id);
                    const opponent = match.player1_id === userId ? player2 : player1;

                    actions.push({
                        id: match.id,
                        type: "confirm_score",
                        ladder_id: match.ladder_id,
                        ladder_name: (match.ladders as any)?.name || "Unknown Ladder",
                        opponent_name: opponent?.full_name || "Unknown",
                        status: match.status,
                        match_id: match.id,
                    });
                }
            }
        }

        // Pending Matches
        if (pendingMatches) {
            for (const match of pendingMatches) {
                const player1 = userMap.get(match.player1_id);
                const player2 = userMap.get(match.player2_id);
                const opponent = match.player1_id === userId ? player2 : player1;

                actions.push({
                    id: match.id,
                    type: "submit_score",
                    ladder_id: match.ladder_id,
                    ladder_name: (match.ladders as any)?.name || "Unknown Ladder",
                    opponent_name: opponent?.full_name || "Unknown",
                    status: match.status,
                    match_id: match.id,
                });
            }
        }

        // Pending Member Approvals (ORGANIZER)
        for (const approval of pendingMemberApprovals) {
            const requestingUser = userMap.get(approval.user_id);
            actions.push({
                id: approval.id,
                type: "approve_member",
                ladder_id: approval.ladder_id,
                ladder_name: (approval.ladders as any)?.name || "Unknown Ladder",
                requester_name: requestingUser?.full_name || requestingUser?.email || "Unknown",
                requested_at: approval.requested_at,
            });
        }

        // Pending Organizer Requests (ORGANIZER)
        for (const orgReq of pendingOrganizerRequests) {
            const requestingUser = userMap.get(orgReq.user_id);
            actions.push({
                id: orgReq.id,
                type: "approve_organizer",
                ladder_id: orgReq.ladder_id,
                ladder_name: (orgReq.ladders as any)?.name || "Unknown Ladder",
                requester_name: requestingUser?.full_name || requestingUser?.email || "Unknown",
                requested_at: orgReq.created_at,
            });
        }

        // Sort by expires_at or requested_at
        actions.sort((a, b) => {
            const dateA = a.expires_at || a.requested_at;
            const dateB = b.expires_at || b.requested_at;
            if (dateA && !dateB) return -1;
            if (!dateA && dateB) return 1;
            if (dateA && dateB) {
                return new Date(dateA).getTime() - new Date(dateB).getTime();
            }
            return 0;
        });

        return NextResponse.json({ actions });
    } catch (error: any) {
        console.error("[GET /api/dashboard/pending-actions] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
