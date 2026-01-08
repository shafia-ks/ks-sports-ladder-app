import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LadderRankingEntry } from "@/lib/ranking/ranking-engine";
import { RankingRuleType } from "@/types/domain";

async function fetchMatches(userId?: string) {
  const url = userId ? `/api/matches?userId=${encodeURIComponent(userId)}` : "/api/matches";
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
    queryKey: ["matches", userId],
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
