import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
    calculateInactivityPenalty,
    calculateDaysInactive,
    isInGracePeriod,
    shouldSendWarning
} from "@/features/inactivity/utils/penaltyCalculation";
import {
    sendInactivityWarning,
    sendPenaltyApplied
} from "@/features/inactivity/utils/notifications";
import { LadderInactivitySettings } from "@/types/inactivity";

/**
 * POST /api/ladders/[id]/apply-inactivity-penalties
 *
 * Applies inactivity penalties to all eligible members of a ladder.
 * This should be called by a cron job daily.
 */
export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const ladderId = params.id;

    try {
        // Get ladder inactivity settings
        const { data: settings, error: settingsError } = await supabaseAdmin
            .from("ladder_inactivity_settings")
            .select("*")
            .eq("ladder_id", ladderId)
            .single();

        if (settingsError || !settings) {
            return NextResponse.json({
                error: "Inactivity settings not found"
            }, { status: 404 });
        }

        // Skip if system is disabled
        if (!settings.enabled) {
            return NextResponse.json({
                message: "Inactivity system is disabled for this ladder",
                penaltiesApplied: 0
            });
        }

        // Get all active members with their tracking data
        const { data: members, error: membersError } = await supabaseAdmin
            .from("ladder_memberships")
            .select(`
        id,
        user_id,
        current_rank,
        ladder_id,
        accepted_at,
        member_inactivity_tracking (
          last_match_completed_at,
          on_leave,
          penalty_count
        )
      `)
            .eq("ladder_id", ladderId)
            .eq("status", "active")
            .not("current_rank", "is", null);

        if (membersError || !members) {
            return NextResponse.json({
                error: "Failed to fetch members"
            }, { status: 500 });
        }

        const totalMembers = members.length;
        const penaltiesApplied: string[] = [];
        const warningsSent: string[] = [];

        // Get ladder name for notifications
        const { data: ladder } = await supabaseAdmin
            .from("ladders")
            .select("name")
            .eq("id", ladderId)
            .single();

        const ladderName = ladder?.name || "Unknown Ladder";

        // Process each member
        for (const member of members) {
            const tracking = Array.isArray(member.member_inactivity_tracking)
                ? member.member_inactivity_tracking[0]
                : member.member_inactivity_tracking;

            // Skip if on leave
            if (tracking?.on_leave) {
                continue;
            }

            // Skip if in grace period
            if (member.accepted_at && isInGracePeriod(member.accepted_at, settings.new_member_grace_days)) {
                continue;
            }

            // Calculate days inactive
            const daysInactive = calculateDaysInactive(tracking?.last_match_completed_at || null);

            // Check if should send warning
            if (settings.notify_before_penalty && settings.notification_days_before) {
                if (shouldSendWarning(daysInactive, settings.threshold_days, settings.notification_days_before)) {
                    const daysUntilPenalty = settings.threshold_days - daysInactive;
                    await sendInactivityWarning({
                        userId: member.user_id,
                        ladderName,
                        daysInactive,
                        daysUntilPenalty,
                        penaltyType: settings.penalty_type,
                        penaltySeverity: settings.penalty_severity,
                    });
                    warningsSent.push(member.user_id);
                }
            }

            // Calculate penalty
            const penaltyResult = calculateInactivityPenalty(
                member,
                settings as LadderInactivitySettings,
                totalMembers,
                daysInactive
            );

            if (!penaltyResult.shouldApplyPenalty) {
                continue;
            }

            // Handle removal penalty type
            if (settings.penalty_type === "removal") {
                await supabaseAdmin
                    .from("ladder_memberships")
                    .update({ status: "removed" })
                    .eq("id", member.id);

                penaltiesApplied.push(member.user_id);
                continue;
            }

            // Apply rank penalty
            if (penaltyResult.newRank && penaltyResult.newRank !== member.current_rank) {
                // Update member rank
                await supabaseAdmin
                    .from("ladder_memberships")
                    .update({
                        current_rank: penaltyResult.newRank,
                        previous_rank: member.current_rank
                    })
                    .eq("id", member.id);

                // Record penalty in history
                await supabaseAdmin
                    .from("inactivity_penalty_history")
                    .insert({
                        ladder_id: ladderId,
                        user_id: member.user_id,
                        penalty_type: penaltyResult.penaltyType,
                        penalty_severity: penaltyResult.penaltySeverity,
                        rank_before: member.current_rank,
                        rank_after: penaltyResult.newRank,
                        days_inactive: daysInactive,
                        protected_by_floor: penaltyResult.protectedByFloor || false,
                        reason: penaltyResult.reason,
                    });

                // Update penalty count
                await supabaseAdmin
                    .from("member_inactivity_tracking")
                    .update({
                        penalty_count: (tracking?.penalty_count || 0) + 1
                    })
                    .eq("ladder_id", ladderId)
                    .eq("user_id", member.user_id);

                // Send penalty notification
                await sendPenaltyApplied({
                    userId: member.user_id,
                    ladderName,
                    penaltyType: settings.penalty_type,
                    rankBefore: member.current_rank!,
                    rankAfter: penaltyResult.newRank,
                    daysInactive,
                });

                penaltiesApplied.push(member.user_id);
            }
        }

        return NextResponse.json({
            success: true,
            penaltiesApplied: penaltiesApplied.length,
            warningsSent: warningsSent.length,
            details: {
                penaltiesApplied,
                warningsSent,
            }
        });

    } catch (error) {
        console.error("Error applying inactivity penalties:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
