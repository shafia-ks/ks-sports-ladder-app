"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, X, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface OrganizerRequest {
    id: string;
    user_id: string;
    user_email: string;
    user_name: string;
    requested_role: "organizer" | "admin";
    status: "pending" | "approved" | "rejected";
    reason: string;
    requested_at: string;
    ladder_name?: string;
}

export function AdminRequestsTable() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<OrganizerRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: "danger" | "warning" | "primary";
        requiresInput?: boolean;
        inputPlaceholder?: string;
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
    });
    const [rejectReason, setRejectReason] = useState("");

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await fetch("/api/leader-requests");
            if (!response.ok) throw new Error("Failed to fetch requests");
            const data = await response.json();
            const transformedRequests = data.requests.map((req: any) => ({
                id: req.id,
                user_id: req.user_id,
                user_email: req.users?.email || "unknown@example.com",
                user_name: req.users?.full_name || req.users?.email || "Unknown User",
                requested_role: req.requested_role,
                status: req.status,
                reason: req.reason,
                requested_at: req.requested_at,
                ladder_name: req.ladders?.name,
            }));
            // Filter to pending only by default for the 'Inbox' feel, or show all?
            // Let's show all but sort pending first
            setRequests(transformedRequests.sort((a: any, b: any) => (a.status === 'pending' ? -1 : 1)));
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId: string) => {
        setConfirmModal({
            isOpen: true,
            title: "Approve Request",
            message: "Are you sure you want to approve this organizer request?",
            variant: "primary",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setProcessing(requestId);
                try {
                    const response = await fetch(`/api/leader-requests/${requestId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            status: "approved",
                            admin_id: user?.id,
                        }),
                    });
                    if (!response.ok) throw new Error("Failed to approve");
                    await fetchRequests();
                } catch (error) {
                    alert("Failed to approve request");
                } finally {
                    setProcessing(null);
                }
            },
        });
    };

    const handleReject = async (requestId: string) => {
        setConfirmModal({
            isOpen: true,
            title: "Reject Request",
            message: "Please provide a reason for rejecting this request:",
            variant: "danger",
            requiresInput: true,
            inputPlaceholder: "Enter rejection reason...",
            onConfirm: async () => {
                if (!rejectReason.trim()) {
                    alert("Please provide a rejection reason");
                    return;
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setProcessing(requestId);
                try {
                    const response = await fetch(`/api/leader-requests/${requestId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            status: "rejected",
                            rejection_reason: rejectReason,
                            admin_id: user?.id,
                        }),
                    });
                    if (!response.ok) throw new Error("Failed to reject");
                    await fetchRequests();
                    setRejectReason("");
                } catch (error) {
                    alert("Failed to reject request");
                } finally {
                    setProcessing(null);
                }
            },
        });
    };

    if (loading) return <div className="p-8 text-center text-slate-500"><Loader2 className="h-6 w-6 animate-spin inline mr-2" /> Loading...</div>;

    return (
        <div className="card overflow-hidden">
            <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Role Requested</th>
                        <th className="px-4 py-3">For Ladder</th>
                        <th className="px-4 py-3">Reason</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500">No requests found.</td></tr>
                    ) : (
                        requests.map(req => (
                            <tr key={req.id} className="border-t border-slate-100">
                                <td className="px-4 py-3">
                                    <div className="font-medium text-slate-900">{req.user_name}</div>
                                    <div className="text-xs text-slate-500">{req.user_email}</div>
                                </td>
                                <td className="px-4 py-3 font-semibold text-brand-600">{req.requested_role}</td>
                                <td className="px-4 py-3 text-slate-600">{req.ladder_name || "Global / N/A"}</td>
                                <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate" title={req.reason}>{req.reason}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${req.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                        req.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                        {req.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {req.status === 'pending' && (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleApprove(req.id)} disabled={!!processing} className="text-green-600 hover:text-green-700 disabled:opacity-50">
                                                <Check className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleReject(req.id)} disabled={!!processing} className="text-red-600 hover:text-red-700 disabled:opacity-50">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
