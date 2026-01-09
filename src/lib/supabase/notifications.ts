import { supabaseAdmin } from "@/lib/supabase/server";

export interface CreateNotificationParams {
  userId: string;
  type:
  | "ladder_invitation"
  | "challenge_received"
  | "challenge_accepted"
  | "challenge_declined"
  | "match_ready"
  | "score_to_confirm"
  | "match_confirmed"
  | "rank_changed";
  message: string;
  link?: string;
  metadata?: Record<string, any>;
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
        message: params.message,
        link: params.link || null,
        metadata: params.metadata || {},
        read: false,
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
          message: n.message,
          link: n.link || null,
          metadata: n.metadata || {},
          read: false,
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
