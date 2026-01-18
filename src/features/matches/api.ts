import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LadderRankingEntry } from "@/lib/ranking/ranking-engine";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { RankingRuleType } from "@/types/domain";

async function fetchMatches(userId?: string) {
  // FIXED: Always filter by Confirmed status for dashboard/profile
  const params = new URLSearchParams();
  if (userId) {
    params.set('userId', userId);
  }
  params.set('status', 'Confirmed');

  const url = `/api/matches?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load matches");
  return res.json();
}

async function submitMatch(data: {
  ladderId: string;
  challengeId?: string;
  player1Id: string;
  player2Id: string;
  winnerId: string;
  loserId: string;
  setScores?: string[];
  playedAt?: string;
  ruleType: RankingRuleType;
  ranking: LadderRankingEntry[];
}) {
  const res = await fetch("/api/matches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json();
    throw new Error((body.errors || [body.message]).join("; "));
  }
  return res.json();
}

export function useMatches(userId?: string) {
  return useQuery({
    queryKey: ["matches", userId, "Confirmed"],
    queryFn: () => fetchMatches(userId)
  });
}

export function useSubmitMatch() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: submitMatch,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

// Hook to cancel a match (mutual forfeit/void)
export function useCancelMatch() {
  const queryClient = useQueryClient();
  const { push: toast } = useToast();

  return useMutation({
    mutationFn: async ({ matchId, challengeId, reason }: { matchId: string; challengeId?: string; reason?: string }) => {
      if (!supabase) throw new Error("Supabase client not initialized");
      const { error } = await supabase.rpc('cancel_match_no_winner', {
        p_match_id: matchId,
        p_cancelled_by: (await supabase.auth.getUser()).data.user?.id,
        p_challenge_id: challengeId,
        p_reason: reason || 'Mutual Forfeit'
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Match Cancelled",
        description: "The match has been voided and players are unlocked.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-matches"] });
      queryClient.invalidateQueries({ queryKey: ["pending-actions"] });
    },
    onError: (error) => {
      console.error("Error cancelling match:", error);
      toast({
        title: "Error",
        description: "Failed to cancel match. Please try again.",
        variant: "error",
      });
    },
  });
}

export function useConfirmMatch() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId, action, reason }: { id: string; userId: string; action: "confirm" | "dispute"; reason?: string }) => {
      const res = await fetch(`/api/matches/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, action, reason }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to confirm match");
      }
      return res.json();
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["matches"] });
      client.invalidateQueries({ queryKey: ["pendingActions"] });
    },
  });
}

export function useSubmitScore() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId, setScores, winnerId, playedAt }: { id: string; userId: string; setScores: string[]; winnerId: string; playedAt: string }) => {
      const res = await fetch(`/api/matches/${id}/submit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          set_scores: setScores,
          winner_id: winnerId,
          played_at: playedAt,
          status: "ScoreSubmitted",
          user_id: userId,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to submit score");
      }
      return res.json();
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["matches"] });
      client.invalidateQueries({ queryKey: ["pendingActions"] });
    },
  });
}
