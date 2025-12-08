import { supabaseAdmin } from "./server";

export async function createNotification(params: {
  userId: string;
  type: string;
  message: string;
  link?: string;
}) {
  if (!supabaseAdmin) return;
  await supabaseAdmin.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    message: params.message,
    link: params.link ?? null,
    read: false,
  });
}

export async function notifyChallenge(params: {
  challengedId: string;
  challengerId: string;
  challengeId: string;
  ladderName: string;
}) {
  await createNotification({
    userId: params.challengedId,
    type: "challenge_received",
    message: `New challenge from player ${params.challengerId} on ${params.ladderName}`,
    link: `/challenges/${params.challengeId}`,
  });
}

export async function notifyMatchSubmitted(params: {
  opponentId: string;
  submitterId: string;
  matchId: string;
}) {
  await createNotification({
    userId: params.opponentId,
    type: "match_submitted",
    message: `Match result awaiting your confirmation (submitted by ${params.submitterId})`,
    link: `/matches/${params.matchId}`,
  });
}
