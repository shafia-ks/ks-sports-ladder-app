import { useMemo } from "react";

interface Member {
    id: string;
    user_id: string;
    status: string;
    current_rank: number | null;
    previous_rank?: number | null;
    is_busy?: boolean;
    users?: any;
}

export function useLadderMembers(members: Member[], userId?: string) {
    const activeMembers = useMemo(() =>
        members.filter((m) => m.status === "active"),
        [members]
    );

    const pendingMembers = useMemo(() =>
        members.filter((m) => m.status === "pending"),
        [members]
    );

    const activeMembersSorted = useMemo(() =>
        [...activeMembers].sort((a, b) => {
            const rankA = a.current_rank && a.current_rank > 0 ? a.current_rank : Number.MAX_SAFE_INTEGER;
            const rankB = b.current_rank && b.current_rank > 0 ? b.current_rank : Number.MAX_SAFE_INTEGER;
            return rankA - rankB;
        }),
        [activeMembers]
    );

    const userMembership = useMemo(() =>
        userId ? members.find((m) => m.user_id === userId) : null,
        [members, userId]
    );

    const currentMember = useMemo(() =>
        userMembership?.status === "active" ? userMembership : null,
        [userMembership]
    );

    const isMember = useMemo(() =>
        !!userMembership && userMembership.status === "active",
        [userMembership]
    );

    const isPending = useMemo(() =>
        !!userMembership && userMembership.status === "pending",
        [userMembership]
    );

    const currentUserRank = useMemo(() =>
        currentMember?.current_rank || null,
        [currentMember]
    );

    return {
        activeMembers,
        pendingMembers,
        activeMembersSorted,
        userMembership,
        currentMember,
        isMember,
        isPending,
        currentUserRank
    };
}
