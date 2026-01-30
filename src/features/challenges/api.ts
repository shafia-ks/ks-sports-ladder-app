import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutate } from "swr";
import { ChallengeValidationContext } from "@/lib/challenges/validation";

async function fetchChallenges(userId?: string) {
  const url = userId ? `/api/challenges?userId=${encodeURIComponent(userId)}` : "/api/challenges";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load challenges");
  return res.json();
}

async function createChallenge(data: ChallengeValidationContext) {
  const res = await fetch("/api/challenges", {
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

export function useChallenges(userId?: string) {
  return useQuery({
    queryKey: ["challenges", userId],
    queryFn: () => fetchChallenges(userId)
  });
}

export function useCreateChallenge() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createChallenge,
    onSuccess: () => {
      // Invalidate all related queries
      client.invalidateQueries({ queryKey: ["challenges"] });
      client.invalidateQueries({ queryKey: ["pendingActions"] });
      client.invalidateQueries({ queryKey: ["pendingActions_v2"] });
      client.invalidateQueries({ queryKey: ["ladder"] });
      client.invalidateQueries({ queryKey: ["smart-targets"] });
      mutate(() => true);
    },
  });
}

export function useRespondToChallenge() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "Accepted" | "Declined" }) => {
      const res = await fetch(`/api/challenges/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to update challenge");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all related queries
      client.invalidateQueries({ queryKey: ["challenges"] });
      client.invalidateQueries({ queryKey: ["pendingActions"] });
      client.invalidateQueries({ queryKey: ["pendingActions_v2"] });
      client.invalidateQueries({ queryKey: ["matches"] });
      client.invalidateQueries({ queryKey: ["dashboard-matches"] });
      client.invalidateQueries({ queryKey: ["ladder"] });
      client.invalidateQueries({ queryKey: ["smart-targets"] });
      mutate(() => true);
    },
  });
}
