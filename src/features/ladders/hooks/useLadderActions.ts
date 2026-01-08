import { useState } from "react";

export function useLadderActions(ladderId: string, onSuccess?: () => void) {
    const [joining, setJoining] = useState(false);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    const joinLadder = async (userId: string) => {
        setJoining(true);
        try {
            const res = await fetch(`/api/ladders/${ladderId}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId }),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Failed to join ladder");
            }

            onSuccess?.();
            return true;
        } catch (err) {
            throw err;
        } finally {
            setJoining(false);
        }
    };

    const approveMember = async (memberId: string) => {
        setApprovingId(memberId);
        try {
            const res = await fetch(`/api/ladders/${ladderId}/members/${memberId}/approve`, {
                method: "PATCH",
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Failed to approve member");
            }

            onSuccess?.();
            return true;
        } catch (err) {
            throw err;
        } finally {
            setApprovingId(null);
        }
    };

    const rejectMember = async (memberId: string) => {
        setRejectingId(memberId);
        try {
            const res = await fetch(`/api/ladders/${ladderId}/members/${memberId}/reject`, {
                method: "PATCH",
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Failed to reject member");
            }

            onSuccess?.();
            return true;
        } catch (err) {
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
