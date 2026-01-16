import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function usePendingInvitations(email?: string | null) {
    return useQuery({
        queryKey: ["invitations", email],
        queryFn: async () => {
            if (!email) return [];
            const res = await fetch(`/api/invitations?email=${encodeURIComponent(email)}`);
            const data = await res.json();
            if (!res.ok) {
                // If 404 or empty, just return empty
                return [];
            }
            return data.invitations || [];
        },
        enabled: !!email,
        staleTime: 1000 * 60, // 1 minute
    });
}

export function useRespondToInvitation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, action, userId }: { id: string; action: 'accept' | 'reject'; userId: string }) => {
            const res = await fetch(`/api/invitations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, user_id: userId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invitations"] });
            queryClient.invalidateQueries({ queryKey: ["memberships"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
        },
    });
}
