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
        avatar_url: string | null;
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
        <div className="card p-4">
            <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-brand-600" />
                Pending Member Approvals ({members.length})
            </h2>

            <div className="mb-3">
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                {filteredMembers.map((member) => {
                    const displayName = getDisplayName(member);
                    return (
                        <div
                            key={member.id}
                            className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-white border border-slate-200 shadow-sm"
                        >
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                <Avatar name={displayName} email={member.users?.email} src={member.users?.avatar_url} size="sm" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 mb-0.5">
                                        <span className="text-sm font-semibold text-slate-900 truncate">
                                            {displayName}
                                        </span>
                                        <span className="text-[10px] text-amber-700 flex items-center gap-0.5 whitespace-nowrap">
                                            <Clock className="h-2.5 w-2.5" /> Awaiting approval
                                        </span>
                                    </div>
                                    {member.users?.email && (
                                        <span className="text-[10px] text-slate-500 truncate block">{member.users.email}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    className={`btn btn-success btn-sm flex-1 sm:flex-none flex items-center justify-center gap-1 ${approvingId || rejectingId ? "opacity-60 pointer-events-none" : ""
                                        }`}
                                    onClick={() => handleApprove(member.id)}
                                    disabled={!!(approvingId || rejectingId)}
                                >
                                    {approvingId === member.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <CheckCircle className="h-3 w-3" />
                                    )}
                                    Approve
                                </button>
                                <button
                                    className={`btn btn-danger btn-sm flex-1 sm:flex-none flex items-center justify-center gap-1 ${approvingId || rejectingId ? "opacity-60 pointer-events-none" : ""
                                        }`}
                                    onClick={() => handleReject(member.id)}
                                    disabled={!!(approvingId || rejectingId)}
                                >
                                    {rejectingId === member.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <X className="h-3 w-3" />
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
