"use client";

import { useState, useEffect } from "react";
import { UserPlus, CheckCircle, X, Loader2, Clock } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface OrganizerRequest {
    id: string;
    user_id: string;
    reason: string;
    requested_at: string;
    users: {
        id: string;
        email: string;
        first_name: string | null;
        last_name: string | null;
    };
}

interface Props {
    ladderId: string;
    onRequestProcessed?: () => void;
}

export function PendingOrganizerRequests({ ladderId, onRequestProcessed }: Props) {
    const [requests, setRequests] = useState<OrganizerRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchRequests = async () => {
        try {
            const res = await fetch(`/api/leader-requests?ladder_id=${ladderId}&status=pending`);
            if (res.ok) {
                const json = await res.json();
                setRequests(json.requests || []);
            }
        } catch (err) {
            console.error("Failed to fetch organizer requests:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [ladderId]);

    const handleApprove = async (requestId: string) => {
        setProcessingId(requestId);
        try {
            const res = await fetch(`/api/leader-requests/${requestId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "approved" }),
            });

            if (res.ok) {
                await fetchRequests();
                onRequestProcessed?.();
            } else {
                const json = await res.json();
                alert(json.error || "Failed to approve request");
            }
        } catch (err) {
            alert("Failed to approve request");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (requestId: string) => {
        const reason = prompt("Rejection reason (optional):");
        if (reason === null) return; // User cancelled

        setProcessingId(requestId);
        try {
            const res = await fetch(`/api/leader-requests/${requestId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "rejected",
                    rejection_reason: reason || "No reason provided",
                }),
            });

            if (res.ok) {
                await fetchRequests();
                onRequestProcessed?.();
            } else {
                const json = await res.json();
                alert(json.error || "Failed to reject request");
            }
        } catch (err) {
            alert("Failed to reject request");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return null;
    }

    if (requests.length === 0) return null;

    return (
        <div className="card p-4">
            <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-brand-600" />
                Pending Organizer Requests ({requests.length})
            </h2>

            <div className="space-y-2">
                {requests.map((request) => {
                    const displayName =
                        `${request.users?.first_name || ""} ${request.users?.last_name || ""}`.trim() ||
                        request.users?.email ||
                        "Unknown";

                    return (
                        <div
                            key={request.id}
                            className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-white border border-slate-200 shadow-sm"
                        >
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                <Avatar name={displayName} email={request.users?.email} size="sm" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-semibold text-slate-900 truncate">
                                            {displayName}
                                        </span>
                                        <span className="text-[10px] text-amber-700 flex items-center gap-0.5 whitespace-nowrap">
                                            <Clock className="h-2.5 w-2.5" /> Awaiting review
                                        </span>
                                    </div>
                                    {request.users?.email && (
                                        <span className="text-[10px] text-slate-500 truncate block">{request.users.email}</span>
                                    )}
                                    {request.reason && (
                                        <p className="text-xs text-slate-600 mt-1 italic line-clamp-2">"{request.reason}"</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    className={`btn btn-success btn-sm flex items-center justify-center gap-1 flex-1 sm:flex-none ${!!processingId ? "opacity-60 pointer-events-none" : ""
                                        }`}
                                    onClick={() => handleApprove(request.id)}
                                    disabled={!!processingId}
                                >
                                    {processingId === request.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <CheckCircle className="h-3 w-3" />
                                    )}
                                    Approve
                                </button>
                                <button
                                    className={`btn btn-danger btn-sm flex items-center justify-center gap-1 flex-1 sm:flex-none ${!!processingId ? "opacity-60 pointer-events-none" : ""
                                        }`}
                                    onClick={() => handleReject(request.id)}
                                    disabled={!!processingId}
                                >
                                    {processingId === request.id ? (
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
            </div>
        </div>
    );
}
