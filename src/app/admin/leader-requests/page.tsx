"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/lib/auth/auth-context";
import { ArrowLeft, Check, X, Clock } from "lucide-react";

interface LeaderRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  requested_role: "organizer" | "admin";
  status: "pending" | "approved" | "rejected";
  reason: string;
  requested_at: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

export default function LeaderRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});
  const [showRejectionForm, setShowRejectionForm] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/leader-requests");
      if (!response.ok) throw new Error("Failed to fetch requests");
      const data = await response.json();
      setRequests(data.requests);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
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

      if (!response.ok) throw new Error("Failed to approve request");

      // Remove from pending list immediately
      setRequests((prev) => prev.filter((req) => req.id !== requestId));
      
      // Optionally refetch to get updated data
      await fetchRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Failed to approve request");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectionReason[requestId]) {
      alert("Please provide a rejection reason");
      return;
    }

    setProcessing(requestId);
    try {
      const response = await fetch(`/api/leader-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          rejection_reason: rejectionReason[requestId],
          admin_id: user?.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to reject request");

      // Remove from pending list immediately
      setRequests((prev) => prev.filter((req) => req.id !== requestId));
      
      setRejectionReason((prev) => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });
      setShowRejectionForm((prev) => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });
      
      // Optionally refetch to get updated data
      await fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request");
    } finally {
      setProcessing(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const reviewedRequests = requests.filter((r) => r.status !== "pending");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-brand-600 hover:text-brand-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <PageHeader
            title="Organizer Requests"
            description="Review and approve player requests to become organizers."
          />
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning-600" />
                Pending Requests ({pendingRequests.length})
              </h2>
            </div>

            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="card space-y-4 p-5 border-l-4 border-l-warning-500"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{request.user_name}</h3>
                        <Badge variant="info">{request.requested_role}</Badge>
                      </div>
                      <p className="text-sm text-slate-500">{request.user_email}</p>
                    </div>
                    <p className="text-xs text-slate-500">{formatDate(request.requested_at)}</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-slate-700 mb-1">Reason:</p>
                    <p className="text-sm text-slate-600">{request.reason}</p>
                  </div>

                  {showRejectionForm[request.id] ? (
                    <div className="space-y-3 bg-danger-50 p-3 rounded-lg">
                      <textarea
                        value={rejectionReason[request.id] || ""}
                        onChange={(e) =>
                          setRejectionReason((prev) => ({
                            ...prev,
                            [request.id]: e.target.value,
                          }))
                        }
                        placeholder="Reason for rejection..."
                        className="w-full rounded-lg border border-danger-200 px-3 py-2 text-sm"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={processing === request.id}
                          className="flex-1 btn btn-danger text-sm"
                        >
                          {processing === request.id ? "Rejecting..." : "Confirm Rejection"}
                        </button>
                        <button
                          onClick={() =>
                            setShowRejectionForm((prev) => ({
                              ...prev,
                              [request.id]: false,
                            }))
                          }
                          className="flex-1 btn btn-secondary text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={processing === request.id}
                        className="flex-1 btn btn-success flex items-center justify-center gap-2 text-sm"
                      >
                        <Check className="h-4 w-4" />
                        {processing === request.id ? "Approving..." : "Approve"}
                      </button>
                      <button
                        onClick={() =>
                          setShowRejectionForm((prev) => ({
                            ...prev,
                            [request.id]: true,
                          }))
                        }
                        disabled={processing === request.id}
                        className="flex-1 btn btn-secondary flex items-center justify-center gap-2 text-sm"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviewed Requests */}
        {reviewedRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Reviewed Requests</h2>
            <div className="space-y-2">
              {reviewedRequests.map((request) => (
                <div
                  key={request.id}
                  className={`card p-4 flex items-center justify-between ${
                    request.status === "approved"
                      ? "border-l-4 border-l-success-500"
                      : "border-l-4 border-l-danger-500"
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{request.user_name}</p>
                    <p className="text-xs text-slate-500">{request.user_email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{formatDate(request.requested_at)}</p>
                      {request.reviewed_at && (
                        <p className="text-xs text-slate-400">
                          Reviewed {formatDate(request.reviewed_at)}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={request.status === "approved" ? "success" : "danger"}
                    >
                      {request.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && requests.length === 0 && (
          <div className="card text-center p-8">
            <p className="text-slate-600">No leader requests yet.</p>
          </div>
        )}

        {loading && (
          <div className="card text-center p-8">
            <p className="text-slate-600">Loading...</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
