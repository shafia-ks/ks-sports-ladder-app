import { useQuery } from "@tanstack/react-query";

async function fetchMemberships(userId: string) {
  const res = await fetch(`/api/memberships?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("Failed to load memberships");
  return res.json();
}

export function useMemberships(userId?: string) {
  return useQuery({
    queryKey: ["memberships", userId],
    queryFn: () => fetchMemberships(userId as string),
    enabled: Boolean(userId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
