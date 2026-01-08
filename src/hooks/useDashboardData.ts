import { useMemo } from "react";
import { useMemberships } from "@/features/memberships/api";
import { useChallenges } from "@/features/challenges/api";
import { useMatches } from "@/features/matches/api";
import { useAuth } from "@/lib/auth/auth-context";

export function useDashboardData() {
    const { user } = useAuth();
    const { data: membershipsData, isLoading: membershipsLoading } = useMemberships(user?.id);
    const { data: challengesData, isLoading: challengesLoading } = useChallenges(user?.id);
    const { data: matchesData, isLoading: matchesLoading } = useMatches(user?.id);

    const stats = useMemo(() => {
        if (!membershipsData || !challengesData || !matchesData || !user?.id) {
            return null;
        }

        const myLadders = membershipsData.active ?? [];
        const wins = (matchesData.matches ?? []).filter((m: any) => m.winner_id === user.id).length;
        const totalMatches = (matchesData.matches ?? []).length;

        // Calculate simple streak (wins in a row from most recent)
        let streak = 0;
        for (const match of (matchesData.matches ?? [])) {
            if (match.winner_id === user.id) streak++;
            else break;
        }

        return {
            activeLadders: myLadders.length,
            winRate: totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0,
            currentStreak: streak,
        };
    }, [membershipsData, challengesData, matchesData, user?.id]);

    return {
        user,
        memberships: membershipsData?.active ?? [],
        challenges: challengesData?.challenges ?? [],
        matches: matchesData?.matches ?? [],
        stats,
        isLoading: membershipsLoading || challengesLoading || matchesLoading,
    };
}
