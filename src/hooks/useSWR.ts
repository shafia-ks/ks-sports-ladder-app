import useSWR, { SWRConfiguration } from 'swr';

/**
 * Default SWR configuration
 */
export const swrConfig: SWRConfiguration = {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    shouldRetryOnError: true,
    onError: (error) => {
        // Log errors in development
        if (process.env.NODE_ENV === 'development') {
            console.error('[SWR Error]', error);
        }
    },
};

/**
 * Default fetcher for SWR
 */
export const fetcher = async (url: string) => {
    const res = await fetch(url);

    if (!res.ok) {
        const error: any = new Error('An error occurred while fetching the data.');
        error.info = await res.json();
        error.status = res.status;
        throw error;
    }

    return res.json();
};

/**
 * Hook for fetching ladder data with caching
 */
export function useLadder(ladderId: string | null) {
    const { data, error, mutate, isLoading } = useSWR(
        ladderId ? `/api/ladders/${ladderId}` : null,
        fetcher,
        {
            ...swrConfig,
            dedupingInterval: 60000, // 1 minute for ladder data
        }
    );

    return {
        ladder: data?.ladder,
        members: data?.members,
        organizers: data?.organizers,
        isLoading,
        isError: error,
        mutate,
    };
}

/**
 * Hook for fetching user data with caching
 */
export function useUser(userId: string | null) {
    const { data, error, mutate, isLoading } = useSWR(
        userId ? `/api/users/${userId}` : null,
        fetcher,
        {
            ...swrConfig,
            dedupingInterval: 300000, // 5 minutes for user data
        }
    );

    return {
        user: data,
        isLoading,
        isError: error,
        mutate,
    };
}

/**
 * Hook for fetching challenges with caching
 */
export function useChallenges(ladderId: string | null, userId?: string) {
    const params = new URLSearchParams();
    if (ladderId) params.append('ladderId', ladderId);
    if (userId) params.append('userId', userId);

    const { data, error, mutate, isLoading } = useSWR(
        ladderId ? `/api/challenges?${params.toString()}` : null,
        fetcher,
        {
            ...swrConfig,
            dedupingInterval: 30000, // 30 seconds for challenges
        }
    );

    return {
        challenges: data?.challenges || [],
        isLoading,
        isError: error,
        mutate,
    };
}

/**
 * Hook for fetching matches with caching
 */
export function useMatches(ladderId: string | null) {
    const { data, error, mutate, isLoading } = useSWR(
        ladderId ? `/api/matches?ladderId=${ladderId}` : null,
        fetcher,
        {
            ...swrConfig,
            dedupingInterval: 30000, // 30 seconds for matches
        }
    );

    return {
        matches: data?.matches || [],
        isLoading,
        isError: error,
        mutate,
    };
}

/**
 * Hook for fetching dashboard stats with caching
 */
export function useDashboardStats(ladderId: string | null, userId: string | null) {
    const { data, error, mutate, isLoading } = useSWR(
        ladderId && userId ? `/api/ladders/${ladderId}/dashboard-stats?userId=${userId}` : null,
        fetcher,
        {
            ...swrConfig,
            dedupingInterval: 60000, // 1 minute for stats
        }
    );

    return {
        stats: data,
        isLoading,
        isError: error,
        mutate,
    };
}
