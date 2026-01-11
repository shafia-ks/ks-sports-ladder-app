import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

interface UseLadderRealtimeOptions {
    ladderId: string;
    onChallengeChange?: () => void;
    onMatchChange?: () => void;
    onRankingChange?: () => void;
    enabled?: boolean;
}

/**
 * Custom hook for subscribing to real-time ladder events
 * Automatically manages subscriptions and cleanup
 */
export function useLadderRealtime({
    ladderId,
    onChallengeChange,
    onMatchChange,
    onRankingChange,
    enabled = true,
}: UseLadderRealtimeOptions) {
    useEffect(() => {
        if (!enabled || !ladderId || !supabase) return;

        const channels: any[] = [];

        // Subscribe to challenges table
        if (onChallengeChange) {
            const challengeChannel = supabase
                .channel(`challenges:${ladderId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'challenges',
                        filter: `ladder_id=eq.${ladderId}`,
                    },
                    () => {
                        logger.debug('[Realtime] Challenge change detected');
                        onChallengeChange();
                    }
                )
                .subscribe();

            channels.push(challengeChannel);
        }

        // Subscribe to matches table
        if (onMatchChange) {
            const matchChannel = supabase
                .channel(`matches:${ladderId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'matches',
                        filter: `ladder_id=eq.${ladderId}`,
                    },
                    () => {
                        logger.debug('[Realtime] Match change detected');
                        onMatchChange();
                    }
                )
                .subscribe();

            channels.push(matchChannel);
        }

        // Subscribe to ladder_memberships table (for rankings)
        if (onRankingChange) {
            const rankingChannel = supabase
                .channel(`rankings:${ladderId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'ladder_memberships',
                        filter: `ladder_id=eq.${ladderId}`,
                    },
                    () => {
                        logger.debug('[Realtime] Ranking change detected');
                        onRankingChange();
                    }
                )
                .subscribe();

            channels.push(rankingChannel);
        }

        // Cleanup function
        return () => {
            channels.forEach((channel) => {
                if (supabase) {
                    supabase.removeChannel(channel);
                }
            });
        };
    }, [ladderId, onChallengeChange, onMatchChange, onRankingChange, enabled]);
}
