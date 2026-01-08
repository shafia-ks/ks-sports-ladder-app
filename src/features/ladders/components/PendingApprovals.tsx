import { Avatar } from "@/components/ui/avatar";
import { Users, Clock, CheckCircle, X, Loader2 } from "lucide-react";
import { useState } from "react";

interface PendingMember {
    id: string;
    user_id: string;
    users?: {
        full_name: string | null;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
    } | null;
}

interface PendingApprovalsProps {
    members: PendingMember[];
    onApprove: (memberId: string) => Promise<void>;
    onReject: (memberId: string) => Promise<void>;
}

export function PendingApprovals({ members, onApprove, onReject }: PendingApprovalsProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    const getDisplayName = (member: PendingMember) => {
        return member.users?.full_name ||
            `${member.users?.first_name || ''} ${member.users?.last_name || ''}`.trim() ||
            member.users?.email ||
            "Unknown";
    };

    const filteredMembers = members.filter((member) => {
        const name = getDisplayName(member).toLowerCase();
        const email = member.users?.email?.toLowerCase() || "";
        const search = searchTerm.toLowerCase();
        return name.includes(search) || email.includes(search);
    });

    const handleApprove = async (memberId: string) => {
        setApprovingId(memberId);
        try {
            await onApprove(memberId);
        } finally {
            setApprovingId(null);
        }
    };

    const handleReject = async (memberId: string) => {
        setRejectingId(memberId);
        try {
            await onReject(memberId);
        } finally {
            setRejectingId(null);
        }
    };

    if (members.length === 0) return null;

    return (
        <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-600" />
                Pending Member Approvals ({members.length})
            </h2>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="space-y-3">
                {filteredMembers.map((member) => {
                    const displayName = getDisplayName(member);
                    return (
                        <div
                            key={member.id}
                            className="flex items-center gap-4 p-4 rounded-lg bg-white border border-slate-200 shadow-sm"
                        >
                            <Avatar name={displayName} email={member.users?.email} size="md" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-base font-semibold text-slate-900 truncate">
                                        {displayName}
                                    </span>
                                    <span className="text-xs text-amber-700 flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> Awaiting approval
                                    </span>
                                </div>
                                {member.users?.email && (
                                    <span className="text-xs text-slate-500 truncate">{member.users.email}</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className={`btn btn-success btn-sm flex items-center gap-1 ${approvingId === member.id ? "opacity-60 pointer-events-none" : ""
                                        }`}
                                    onClick={() => handleApprove(member.id)}
                                    disabled={approvingId === member.id}
                                >
                                    {approvingId === member.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <CheckCircle className="h-4 w-4" />
                                    )}
                                    Approve
                                </button>
                                <button
                                    className={`btn btn-danger btn-sm flex items-center gap-1 ${rejectingId === member.id ? "opacity-60 pointer-events-none" : ""
                                        }`}
                                    onClick={() => handleReject(member.id)}
                                    disabled={rejectingId === member.id}
                                >
                                    {rejectingId === member.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <X className="h-4 w-4" />
                                    )}
                                    Reject
                                </button>
                            </div>
                        </div>
                    );
                })}
                {filteredMembers.length === 0 && (
                    <div className="text-center text-sm text-slate-500 py-8">
                        No pending requests found.
                    </div>
                )}
            </div>
        </div>
    );
}
