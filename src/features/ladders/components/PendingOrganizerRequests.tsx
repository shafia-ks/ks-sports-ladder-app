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
        return (
            <div className="card p-6">
                <div className="animate-pulse space-y-3">
                    <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-20 bg-slate-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (requests.length === 0) return null;

    return (
        <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-brand-600" />
                Pending Organizer Requests ({requests.length})
            </h2>

            <div className="space-y-3">
                {requests.map((request) => {
                    const displayName =
                        `${request.users?.first_name || ""} ${request.users?.last_name || ""}`.trim() ||
                        request.users?.email ||
                        "Unknown";

                    return (
                        <div
                            key={request.id}
                            className="flex items-center gap-4 p-4 rounded-lg bg-white border border-slate-200 shadow-sm"
                        >
                            <Avatar name={displayName} email={request.users?.email} size="md" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-base font-semibold text-slate-900 truncate">
                                        {displayName}
                                    </span>
                                    <span className="text-xs text-amber-700 flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> Awaiting review
                                    </span>
                                </div>
                                {request.users?.email && (
                                    <span className="text-xs text-slate-500 truncate block">{request.users.email}</span>
                                )}
                                {request.reason && (
                                    <p className="text-sm text-slate-600 mt-2 italic">"{request.reason}"</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className={`btn btn-success btn-sm flex items-center gap-1 ${processingId === request.id ? "opacity-60 pointer-events-none" : ""
                                        }`}
                                    onClick={() => handleApprove(request.id)}
                                    disabled={processingId === request.id}
                                >
                                    {processingId === request.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <CheckCircle className="h-4 w-4" />
                                    )}
                                    Approve
                                </button>
                                <button
                                    className={`btn btn-danger btn-sm flex items-center gap-1 ${processingId === request.id ? "opacity-60 pointer-events-none" : ""
                                        }`}
                                    onClick={() => handleReject(request.id)}
                                    disabled={processingId === request.id}
                                >
                                    {processingId === request.id ? (
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
            </div>
        </div>
    );
}
