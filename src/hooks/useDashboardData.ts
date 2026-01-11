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

        // FIXED: Only count CONFIRMED matches for stats
        const confirmedMatches = (matchesData.matches ?? []).filter((m: any) => m.status === 'Confirmed');
        const wins = confirmedMatches.filter((m: any) => m.winner_id === user.id).length;
        const totalMatches = confirmedMatches.length;

        // Calculate streak from most recent confirmed matches (ordered by played_at or created_at)
        const sortedMatches = [...confirmedMatches].sort((a: any, b: any) => {
            const dateA = new Date(a.played_at || a.created_at).getTime();
            const dateB = new Date(b.played_at || b.created_at).getTime();
            return dateB - dateA; // Most recent first
        });

        let streak = 0;
        for (const match of sortedMatches) {
            if (match.winner_id === user.id) {
                streak++;
            } else {
                break;
            }
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
