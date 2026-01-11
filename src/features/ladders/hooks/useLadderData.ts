import { useState, useEffect } from "react";

interface LadderData {
    ladder: any;
    members: any[];
    organizers: any[];
    organizerIds: string[];
    memberCounts: { active: number; pending: number };
    challengeCounts: { active: number };
    matchCounts: { confirmed: number };
    dashboardStats?: any;
}

import { useQuery, useQueryClient } from "@tanstack/react-query";

interface LadderData {
    ladder: any;
    members: any[];
    organizers: any[];
    organizerIds: string[];
    memberCounts: { active: number; pending: number };
    challengeCounts: { active: number };
    matchCounts: { confirmed: number };
    dashboardStats?: any;
}

export function useLadderData(ladderId: string, userId?: string) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['ladder', ladderId, userId],
        queryFn: async () => {
            const res = await fetch(`/api/ladders/${ladderId}`, {
                headers: userId ? { 'x-user-id': userId } : {}
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Failed to load ladder");
            }

            return res.json() as Promise<LadderData>;
        },
        enabled: !!ladderId,
        staleTime: 60 * 1000, // 1 minute
    });

    return {
        data: query.data,
        isLoading: query.isLoading,
        error: query.error ? (query.error as Error).message : null,
        refetch: async (silent = false) => {
            if (silent) {
                // If silent, just invalidate to trigger bg refetch
                await queryClient.invalidateQueries({ queryKey: ['ladder', ladderId] });
            } else {
                await query.refetch();
            }
        }
    };
}
