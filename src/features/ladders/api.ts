import { useQuery } from "@tanstack/react-query";

async function fetchLadders() {
  const res = await fetch("/api/ladders");
  if (!res.ok) throw new Error("Failed to load ladders");
  return res.json();
}

export function useLadders() {
  return useQuery({ queryKey: ["ladders"], queryFn: fetchLadders });
}
