// API hooks for inactivity penalty system
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LadderInactivitySettings } from "@/types/inactivity";

// Fetch inactivity settings for a ladder
async function fetchInactivitySettings(ladderId: string): Promise<LadderInactivitySettings | null> {
    const res = await fetch(`/api/ladders/${ladderId}/inactivity-settings`);
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to load inactivity settings");
    }
    const data = await res.json();
    return data.settings;
}

export function useInactivitySettings(ladderId?: string) {
    return useQuery({
        queryKey: ["inactivity-settings", ladderId],
        queryFn: () => fetchInactivitySettings(ladderId!),
        enabled: Boolean(ladderId),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000,
    });
}

// Update inactivity settings
async function updateInactivitySettings(
    ladderId: string,
    settings: Partial<LadderInactivitySettings>
): Promise<LadderInactivitySettings> {
    const res = await fetch(`/api/ladders/${ladderId}/inactivity-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error("Failed to update inactivity settings");
    const data = await res.json();
    return data.settings;
}

export function useUpdateInactivitySettings(ladderId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (settings: Partial<LadderInactivitySettings>) =>
            updateInactivitySettings(ladderId, settings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inactivity-settings", ladderId] });
        },
    });
}
