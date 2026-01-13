import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";

export interface PendingAction {
    id: string;
    type: "challenge" | "confirm_score" | "submit_score" | "approve_member" | "approve_organizer";
    ladder_id: string;
    ladder_name: string;
    opponent_name?: string;
    requester_name?: string;
    expires_at?: string;
    requested_at?: string;
    status?: string;
    match_id?: string;
}

async function fetchPendingActions(userId: string): Promise<PendingAction[]> {
    const res = await fetch(`/api/dashboard/pending-actions?user_id=${userId}`);
    if (!res.ok) throw new Error("Failed to fetch pending actions");
    const data = await res.json();
    return data.actions || [];
}

export function usePendingActions() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["pendingActions", user?.id],
        queryFn: () => fetchPendingActions(user!.id),
        enabled: !!user?.id,
        staleTime: 60 * 1000, // 1 minute cache
    });
}
