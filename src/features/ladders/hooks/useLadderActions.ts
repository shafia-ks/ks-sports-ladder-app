import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useLadderActions(ladderId: string, onSuccess?: () => void) {
    const [joining, setJoining] = useState(false);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const joinLadder = async (userId: string) => {
        setJoining(true);

        // Optimistic update
        const previousData = queryClient.getQueryData(queryKeys.ladder(ladderId));

        try {
            // Optimistically add user to pending members
            queryClient.setQueryData(queryKeys.ladder(ladderId), (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    members: [
                        ...old.members,
                        {
                            id: `temp-${Date.now()}`,
                            user_id: userId,
                            status: 'pending',
                            current_rank: null,
                            users: null
                        }
                    ],
                    memberCounts: {
                        ...old.memberCounts,
                        pending: (old.memberCounts?.pending || 0) + 1
                    }
                };
            });

            const res = await fetch(`/api/ladders/${ladderId}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId }),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Failed to join ladder");
            }

            // Refetch to get actual data
            await queryClient.invalidateQueries({ queryKey: queryKeys.ladder(ladderId) });
            onSuccess?.();
            return true;
        } catch (err) {
            // Rollback on error
            queryClient.setQueryData(queryKeys.ladder(ladderId), previousData);
            throw err;
        } finally {
            setJoining(false);
        }
    };

    const approveMember = async (memberId: string) => {
        setApprovingId(memberId);

        // Optimistic update
        const previousData = queryClient.getQueryData(queryKeys.ladder(ladderId));

        try {
            // Optimistically move member from pending to active
            queryClient.setQueryData(queryKeys.ladder(ladderId), (old: any) => {
                if (!old) return old;

                const member = old.members.find((m: any) => m.id === memberId);
                if (!member) return old;

                return {
                    ...old,
                    members: old.members.map((m: any) =>
                        m.id === memberId ? { ...m, status: 'active' } : m
                    ),
                    memberCounts: {
                        active: (old.memberCounts?.active || 0) + 1,
                        pending: Math.max((old.memberCounts?.pending || 1) - 1, 0)
                    }
                };
            });

            const res = await fetch(`/api/ladders/${ladderId}/members/${memberId}/approve`, {
                method: "PATCH",
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Failed to approve member");
            }

            // Refetch to get actual data
            await queryClient.invalidateQueries({ queryKey: queryKeys.ladder(ladderId) });
            onSuccess?.();
            return true;
        } catch (err) {
            // Rollback on error
            queryClient.setQueryData(queryKeys.ladder(ladderId), previousData);
            throw err;
        } finally {
            setApprovingId(null);
        }
    };

    const rejectMember = async (memberId: string) => {
        setRejectingId(memberId);

        // Optimistic update
        const previousData = queryClient.getQueryData(queryKeys.ladder(ladderId));

        try {
            // Optimistically remove member
            queryClient.setQueryData(queryKeys.ladder(ladderId), (old: any) => {
                if (!old) return old;

                return {
                    ...old,
                    members: old.members.filter((m: any) => m.id !== memberId),
                    memberCounts: {
                        ...old.memberCounts,
                        pending: Math.max((old.memberCounts?.pending || 1) - 1, 0)
                    }
                };
            });

            const res = await fetch(`/api/ladders/${ladderId}/members/${memberId}/reject`, {
                method: "PATCH",
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Failed to reject member");
            }

            // Refetch to get actual data
            await queryClient.invalidateQueries({ queryKey: queryKeys.ladder(ladderId) });
            onSuccess?.();
            return true;
        } catch (err) {
            // Rollback on error
            queryClient.setQueryData(queryKeys.ladder(ladderId), previousData);
            throw err;
        } finally {
            setRejectingId(null);
        }
    };

    const updateSettings = async (settings: any) => {
        try {
            const res = await fetch(`/api/ladders/${ladderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Failed to update settings");
            }

            // Invalidate to refetch
            await queryClient.invalidateQueries({ queryKey: queryKeys.ladder(ladderId) });
            onSuccess?.();
            return true;
        } catch (err) {
            throw err;
        }
    };

    return {
        joining,
        approvingId,
        rejectingId,
        joinLadder,
        approveMember,
        rejectMember,
        updateSettings
    };
}
