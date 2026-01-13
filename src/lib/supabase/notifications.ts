import { supabaseAdmin } from "@/lib/supabase/server";

export interface CreateNotificationParams {
  userId: string;
  type:
  | "ladder_invitation"
  | "challenge_received"
  | "challenge_accepted"
  | "challenge_declined"
  | "challenge_expired"
  | "challenge_reminder"
  | "match_ready"
  | "score_to_confirm"
  | "match_confirmed"
  | "match_completed"
  | "match_score_submitted"
  | "match_disputed"
  | "rank_changed"
  | "role_changed"
  | "membership_approved"
  | "membership_rejected"
  | "membership_removed"
  | "join_request"
  | "account_disabled"
  | "account_deleted";
  message: string;
  title?: string;
  link?: string;
  metadata?: Record<string, any>;
}

function getDefaultTitle(type: string): string {
  const titles: Record<string, string> = {
    ladder_invitation: "Ladder Invitation",
    challenge_received: "New Challenge",
    challenge_accepted: "Challenge Accepted",
    challenge_declined: "Challenge Declined",
    challenge_expired: "Challenge Expired",
    challenge_reminder: "Challenge Reminder",
    match_ready: "Match Ready",
    score_to_confirm: "Score Submitted",
    match_confirmed: "Match Confirmed",
    match_completed: "Match Completed",
    match_score_submitted: "Score Submitted",
    match_disputed: "Match Disputed",
    rank_changed: "Rank Update",
    role_changed: "Role Updated",
    membership_approved: "Membership Approved",
    membership_rejected: "Membership Rejected",
    membership_removed: "Membership Removed",
    join_request: "New Join Request",
    account_disabled: "Account Disabled",
    account_deleted: "Account Deleted"
  };
  return titles[type] || "Notification";
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  if (!supabaseAdmin) {
    console.error("[createNotification] Supabase admin client not available");
    return null;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title || getDefaultTitle(params.type),
        message: params.message,
        link: params.link || null,
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error("[createNotification] Error:", error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error("[createNotification] Unexpected error:", error);
    return null;
  }
}

/**
 * Create multiple notifications at once
 */
export async function createNotifications(notifications: CreateNotificationParams[]) {
  if (!supabaseAdmin) {
    console.error("[createNotifications] Supabase admin client not available");
    return [];
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert(
        notifications.map(n => ({
          user_id: n.userId,
          type: n.type,
          title: n.title || getDefaultTitle(n.type),
          message: n.message,
          link: n.link || null,
          metadata: n.metadata || {},
        }))
      )
      .select();

    if (error) {
      console.error("[createNotifications] Error:", error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[createNotifications] Unexpected error:", error);
    return [];
  }
}

/**
 * Legacy function - wrapper for createNotification
 * Used by challenges API
 */
export async function notifyChallenge(params: {
  challengerId: string;
  challengedId: string;
  ladderName?: string;
  link?: string;
}) {
  await createNotification({
    userId: params.challengedId,
    type: "challenge_received",
    message: `You've been challenged${params.ladderName ? ` in ${params.ladderName}` : ""}`,
    link: params.link || "/challenges",
  });
}

/**
 * Legacy function - wrapper for createNotification
 * Used by matches API
 */
export async function notifyMatchSubmitted(params: {
  opponentId?: string;
  playerId?: string;
  submitterId?: string;
  matchId?: string;
  opponentName?: string;
  link?: string;
}) {
  const userId = params.opponentId || params.playerId;
  if (!userId) return;

  await createNotification({
    userId,
    type: "score_to_confirm",
    message: `Score submitted${params.opponentName ? ` by ${params.opponentName}` : ""} - please confirm`,
    link: params.link || (params.matchId ? `/matches/${params.matchId}` : "/matches"),
  });
}
