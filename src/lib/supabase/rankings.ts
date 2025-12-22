import { supabaseAdmin } from "./server";
import { LadderRankingEntry } from "@/lib/ranking/ranking-engine";

export async function updateLadderRanks(params: {
  ladderId: string;
  ranking: LadderRankingEntry[];
}): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) {
    return { success: false, error: "Supabase admin client not initialized" };
  }

  // Atomic transaction: update each membership's currentRank
  const client = supabaseAdmin!;
  const updates = params.ranking.map((entry) =>
    client
      .from("ladder_memberships")
      .update({ current_rank: entry.currentRank })
      .eq("ladder_id", params.ladderId)
      .eq("user_id", entry.userId)
  );

  try {
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      return { success: false, error: failed.error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
