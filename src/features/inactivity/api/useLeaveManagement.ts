// API hooks for leave of absence management
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
    MemberInactivityTracking,
    LeaveUsage,
    LeaveToggleRequest,
    MemberLeaveHistory,
} from "@/types/inactivity";

// Fetch member's inactivity tracking (includes leave status)
async function fetchMemberTracking(
    ladderId: string,
    userId: string
): Promise<MemberInactivityTracking | null> {
    const res = await fetch(`/api/ladders/${ladderId}/members/${userId}/inactivity`);
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to load member tracking");
    }
    const data = await res.json();
    return data.tracking;
}

export function useMemberTracking(ladderId?: string, userId?: string) {
    return useQuery({
        queryKey: ["member-tracking", ladderId, userId],
        queryFn: () => fetchMemberTracking(ladderId!, userId!),
        enabled: Boolean(ladderId && userId),
        staleTime: 1 * 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000,
    });
}

// Fetch leave usage for current year
async function fetchLeaveUsage(ladderId: string, userId: string): Promise<LeaveUsage> {
    const res = await fetch(`/api/ladders/${ladderId}/members/${userId}/leave-usage`);
    if (!res.ok) throw new Error("Failed to load leave usage");
    const data = await res.json();
    return data.usage;
}

export function useLeaveUsage(ladderId?: string, userId?: string) {
    return useQuery({
        queryKey: ["leave-usage", ladderId, userId],
        queryFn: () => fetchLeaveUsage(ladderId!, userId!),
        enabled: Boolean(ladderId && userId),
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000,
    });
}

// Fetch leave history
async function fetchLeaveHistory(
    ladderId: string,
    userId: string
): Promise<MemberLeaveHistory[]> {
    const res = await fetch(`/api/ladders/${ladderId}/members/${userId}/leave-history`);
    if (!res.ok) throw new Error("Failed to load leave history");
    const data = await res.json();
    return data.history;
}

export function useLeaveHistory(ladderId?: string, userId?: string) {
    return useQuery({
        queryKey: ["leave-history", ladderId, userId],
        queryFn: () => fetchLeaveHistory(ladderId!, userId!),
        enabled: Boolean(ladderId && userId),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000,
    });
}

// Toggle leave status
async function toggleLeave(
    ladderId: string,
    userId: string,
    request: LeaveToggleRequest
): Promise<MemberInactivityTracking> {
    const res = await fetch(`/api/ladders/${ladderId}/members/${userId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to toggle leave");
    }
    const data = await res.json();
    return data.tracking;
}

export function useToggleLeave(ladderId: string, userId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: LeaveToggleRequest) => toggleLeave(ladderId, userId, request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["member-tracking", ladderId, userId] });
            queryClient.invalidateQueries({ queryKey: ["leave-usage", ladderId, userId] });
            queryClient.invalidateQueries({ queryKey: ["leave-history", ladderId, userId] });
            queryClient.invalidateQueries({ queryKey: ["memberships"] });
        },
    });
}
