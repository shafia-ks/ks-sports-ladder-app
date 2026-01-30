/**
 * Inactivity Notification System
 * 
 * Handles sending notifications for inactivity warnings and penalty applications
 */

import { supabaseAdmin } from "@/lib/supabase/server";

interface InactivityWarningNotification {
    userId: string;
    ladderName: string;
    daysInactive: number;
    daysUntilPenalty: number;
    penaltyType: string;
    penaltySeverity: number;
}

interface PenaltyAppliedNotification {
    userId: string;
    ladderName: string;
    penaltyType: string;
    rankBefore: number;
    rankAfter: number;
    daysInactive: number;
}

interface LeaveStatusNotification {
    userId: string;
    ladderName: string;
    onLeave: boolean;
    leaveType?: string;
}

/**
 * Send inactivity warning notification
 */
export async function sendInactivityWarning(data: InactivityWarningNotification): Promise<void> {
    if (!supabaseAdmin) {
        console.error("Supabase admin not configured");
        return;
    }

    try {
        // Get user email
        const { data: user } = await supabaseAdmin
            .from("users")
            .select("email, full_name")
            .eq("id", data.userId)
            .single();

        if (!user?.email) {
            console.error("User email not found:", data.userId);
            return;
        }

        const message = `
      <h2>Inactivity Warning - ${data.ladderName}</h2>
      <p>Hi ${user.full_name || 'there'},</p>
      <p>You have been inactive for <strong>${data.daysInactive} days</strong> in the ${data.ladderName} ladder.</p>
      <p>If you don't complete a match within the next <strong>${data.daysUntilPenalty} days</strong>, you will receive an inactivity penalty:</p>
      <ul>
        <li><strong>Penalty Type:</strong> ${formatPenaltyType(data.penaltyType)}</li>
        <li><strong>Severity:</strong> ${data.penaltySeverity}</li>
      </ul>
      <p>To avoid this penalty, please:</p>
      <ul>
        <li>Complete a match, or</li>
        <li>Set yourself as "On Leave" in the ladder dashboard</li>
      </ul>
      <p>Thank you for being part of our ladder community!</p>
    `;

        // Create in-app notification
        await supabaseAdmin.from("notifications").insert({
            user_id: data.userId,
            type: "inactivity_warning",
            title: `⚠️ Inactivity Warning - ${data.ladderName}`,
            message: `You've been inactive for ${data.daysInactive} days. ${data.daysUntilPenalty} days until penalty.`,
            metadata: {
                ladder_name: data.ladderName,
                days_inactive: data.daysInactive,
                days_until_penalty: data.daysUntilPenalty,
                penalty_type: data.penaltyType,
            },
        });

        console.log(`Inactivity warning sent to ${user.email}`);
    } catch (error) {
        console.error("Error sending inactivity warning:", error);
    }
}

/**
 * Send penalty applied notification
 */
export async function sendPenaltyApplied(data: PenaltyAppliedNotification): Promise<void> {
    if (!supabaseAdmin) {
        console.error("Supabase admin not configured");
        return;
    }

    try {
        // Get user email
        const { data: user } = await supabaseAdmin
            .from("users")
            .select("email, full_name")
            .eq("id", data.userId)
            .single();

        if (!user?.email) {
            console.error("User email not found:", data.userId);
            return;
        }

        const rankChange = data.rankAfter - data.rankBefore;
        const message = `
      <h2>Inactivity Penalty Applied - ${data.ladderName}</h2>
      <p>Hi ${user.full_name || 'there'},</p>
      <p>An inactivity penalty has been applied to your ranking in the ${data.ladderName} ladder.</p>
      <p><strong>Details:</strong></p>
      <ul>
        <li><strong>Reason:</strong> Inactive for ${data.daysInactive} days</li>
        <li><strong>Penalty Type:</strong> ${formatPenaltyType(data.penaltyType)}</li>
        <li><strong>Previous Rank:</strong> #${data.rankBefore}</li>
        <li><strong>New Rank:</strong> #${data.rankAfter}</li>
        <li><strong>Positions Dropped:</strong> ${rankChange}</li>
      </ul>
      <p>To improve your ranking, complete matches and stay active!</p>
      <p>If you need to take a break, you can set yourself as "On Leave" to pause inactivity penalties.</p>
    `;

        // Create in-app notification
        await supabaseAdmin.from("notifications").insert({
            user_id: data.userId,
            type: "penalty_applied",
            title: `📉 Inactivity Penalty Applied - ${data.ladderName}`,
            message: `You dropped from rank #${data.rankBefore} to #${data.rankAfter} due to ${data.daysInactive} days of inactivity.`,
            metadata: {
                ladder_name: data.ladderName,
                penalty_type: data.penaltyType,
                rank_before: data.rankBefore,
                rank_after: data.rankAfter,
                days_inactive: data.daysInactive,
            },
        });

        console.log(`Penalty notification sent to ${user.email}`);
    } catch (error) {
        console.error("Error sending penalty notification:", error);
    }
}

/**
 * Send leave status change notification
 */
export async function sendLeaveStatusChange(data: LeaveStatusNotification): Promise<void> {
    if (!supabaseAdmin) {
        console.error("Supabase admin not configured");
        return;
    }

    try {
        const title = data.onLeave
            ? `🏖️ Leave of Absence Started - ${data.ladderName}`
            : `✅ Welcome Back - ${data.ladderName}`;

        const message = data.onLeave
            ? `You are now on leave (${data.leaveType}). Inactivity penalties are paused.`
            : `Your leave has ended. Inactivity tracking has resumed.`;

        // Create in-app notification
        await supabaseAdmin.from("notifications").insert({
            user_id: data.userId,
            type: "leave_status_change",
            title,
            message,
            metadata: {
                ladder_name: data.ladderName,
                on_leave: data.onLeave,
                leave_type: data.leaveType,
            },
        });

        console.log(`Leave status notification sent to user ${data.userId}`);
    } catch (error) {
        console.error("Error sending leave status notification:", error);
    }
}

/**
 * Format penalty type for display
 */
function formatPenaltyType(penaltyType: string): string {
    const types: Record<string, string> = {
        rank_drop: "Rank Drop",
        percentage_drop: "Percentage Drop",
        point_deduction: "Point Deduction",
        relegation: "Relegation to Bottom",
        removal: "Removal from Ladder",
    };
    return types[penaltyType] || penaltyType;
}
