import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";

interface DashboardData {
  memberships: any[];
  pendingChallenges: any[];
  pendingMatches: any[];
  upcomingMatches: any[];
  recentActivity: any[];
  invitations: any[];
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw new Error("Failed to load dashboard data");
  return res.json();
}

export function useDashboardData() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["dashboard", user?.id],
    queryFn: fetchDashboard,
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  return {
    user,
    memberships: data?.memberships ?? [],
    pendingChallenges: data?.pendingChallenges ?? [],
    pendingMatches: data?.pendingMatches ?? [],
    upcomingMatches: data?.upcomingMatches ?? [],
    recentActivity: data?.recentActivity ?? [],
    invitations: data?.invitations ?? [],
    isLoading,
    error,
  };
}
