import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChallengeValidationContext } from "@/lib/challenges/validation";

async function fetchChallenges() {
  const res = await fetch("/api/challenges");
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

export function useChallenges() {
  return useQuery({ queryKey: ["challenges"], queryFn: fetchChallenges });
}

export function useCreateChallenge() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createChallenge,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["challenges"] });
    },
  });
}
