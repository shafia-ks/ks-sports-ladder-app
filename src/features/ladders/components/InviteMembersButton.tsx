"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

interface Props {
    ladderId: string;
    onOpen: () => void;
}

export function InviteMembersButton({ ladderId, onOpen }: Props) {
    return (
        <button
            onClick={onOpen}
            className="btn btn-primary flex items-center gap-2"
        >
            <UserPlus className="h-4 w-4" />
            Invite Members
        </button>
    );
}
