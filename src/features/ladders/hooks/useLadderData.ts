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

export function useLadderData(ladderId: string, userId?: string) {
    const [data, setData] = useState<LadderData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLadder = async (silent = false) => {
        if (!silent) {
            setIsLoading(true);
        }
        setError(null);
        try {
            const res = await fetch(`/api/ladders/${ladderId}`, {
                headers: userId ? { 'x-user-id': userId } : {}
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Failed to load ladder");
            }

            const json = await res.json();
            setData(json);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load ladder");
        } finally {
            if (!silent) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        if (ladderId) {
            fetchLadder();
        }
    }, [ladderId, userId]);

    return {
        data,
        isLoading,
        error,
        refetch: fetchLadder
    };
}
