"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/lib/auth/auth-context";
import { useMemberships } from "@/features/memberships/api";
import { Mail, AlertCircle } from "lucide-react";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { data: membershipsData } = useMemberships(user?.id);
  const myPending = membershipsData?.pending ?? [];

  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvitations = async () => {
      if (!user?.email) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/invitations?email=${encodeURIComponent(user.email)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load invitations");
        setInvitations(json.invitations ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invitations");
      } finally {
        setLoading(false);
      }
    };
    fetchInvitations();
  }, [user?.email]);

  const hasAny = (myPending.length > 0) || (invitations.length > 0);

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <PageHeader
          title="Notifications"
          description="Invitations, join approvals, and admin updates."
        />

        {!hasAny && !loading && !error && (
          <div className="card p-5 text-center space-y-3">
            <p className="text-sm text-slate-600">You have no notifications yet.</p>
            <p className="text-xs text-slate-500">
              Activity from invitations, join requests, and admin updates will show up here.
            </p>
          </div>
        )}

        {loading && (
          <div className="card p-4 text-sm text-slate-600">Loading notifications...</div>
        )}
        {error && (
          <div className="card p-4 text-sm text-red-600">{error}</div>
        )}

        {invitations.length > 0 && (
          <div className="card space-y-3 p-5">
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-brand-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Invitations</p>
                <p className="text-xs text-slate-600">Accept to join the ladder instantly.</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-slate-700">
              {invitations.map((invitation) => (
                <li key={invitation.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 gap-2">
                  <div className="flex flex-col">
                    <span className="font-semibold">{invitation.ladders?.name || "Ladder"}</span>
                    <span className="text-xs text-slate-500">Invited by organizer</span>
                  </div>
                  <div className="text-xs text-slate-500">Expires {invitation.expires_at?.slice(0,10)}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {myPending.length > 0 && (
          <div className="card space-y-3 p-5">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-warning-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Pending join requests</p>
                <p className="text-xs text-slate-600">Awaiting organizer approval.</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-slate-700">
              {myPending.map((membership: any) => (
                <li key={membership.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                  <span>{membership.ladders?.name || "Ladder"}</span>
                  <span className="text-xs text-slate-500">Requested {membership.requested_at?.slice(0, 10) || "recently"}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
