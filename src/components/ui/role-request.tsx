"use client";

import { useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { Badge } from "./badge";

interface RoleRequestProps {
  currentRole: "player" | "organizer" | "admin";
  hasActivRequest: boolean;
}

export function RoleRequest({ currentRole, hasActivRequest }: RoleRequestProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [requestedRole, setRequestedRole] = useState<"organizer" | "admin">("organizer");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/leader-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requested_role: requestedRole,
          reason: requestReason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setMessage(error.error || "Failed to submit request");
        return;
      }

      setMessage("Request submitted! Admin will review it shortly.");
      setRequestReason("");
      setShowForm(false);
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      setMessage("Error submitting request");
    } finally {
      setLoading(false);
    }
  };

  // Don't show if user is already organizer or admin
  if (currentRole !== "player") {
    return null;
  }

  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-info-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">Become a Group Leader</h3>
          <p className="text-sm text-slate-600 mt-1">
            {hasActivRequest
              ? "Your request is pending admin review. You&apos;ll be notified when a decision is made."
              : "Request to become an organizer and create your own groups."}
          </p>

          {hasActivRequest && (
            <div className="mt-3">
              <Badge variant="warning">Request Pending</Badge>
            </div>
          )}

          {!hasActivRequest && (
            <>
              {!showForm ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Submit Request →
                </button>
              ) : (
                <form onSubmit={handleSubmit} className="mt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Role you&apos;re requesting *
                    </label>
                    <select
                      value={requestedRole}
                      onChange={(e) => setRequestedRole(e.target.value as "organizer" | "admin")}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="organizer">Group Leader (Organizer)</option>
                      <option value="admin">Platform Admin</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                      {requestedRole === "organizer"
                        ? "Allows you to create and manage ladders"
                        : "Full platform administration access"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Why would you like this role?
                    </label>
                    <textarea
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      placeholder="Tell us why you want to become a group leader..."
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      rows={3}
                      required
                    />
                  </div>

                  {message && (
                    <div
                      className={`rounded-lg p-3 text-sm ${
                        message.includes("submitted")
                          ? "bg-success-50 text-success-700 border border-success-200"
                          : "bg-danger-50 text-danger-700 border border-danger-200"
                      }`}
                    >
                      {message}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary flex-1 text-sm"
                    >
                      {loading ? "Submitting..." : "Submit Request"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="btn btn-secondary flex-1 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
