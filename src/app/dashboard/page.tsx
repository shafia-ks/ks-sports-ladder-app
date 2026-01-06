"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/ui/page-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useLadders } from "@/features/ladders/api";
import { useMemberships } from "@/features/memberships/api";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2, Swords, AlertCircle, Trophy, Mail, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const { data: laddersData, isLoading: laddersLoading, error: laddersError } = useLadders();
  const {
    data: membershipsData,
    isLoading: membershipsLoading,
    error: membershipsError,
    refetch: refetchMemberships,
  } = useMemberships(user?.id);

  const [invitations, setInvitations] = useState<any[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [invitationsError, setInvitationsError] = useState<string | null>(null);

  const ladders = laddersData?.ladders ?? [];
  const myActive = membershipsData?.active ?? [];
  const myPending = membershipsData?.pending ?? [];
  const isLoading = laddersLoading || membershipsLoading;
  const hasError = laddersError || membershipsError;

  const hasActiveLadder = myActive.length > 0;
  const hasPendingLadder = myPending.length > 0;

  useEffect(() => {
    const fetchInvitations = async () => {
      if (!user?.email) return;
      try {
        setInvitationsLoading(true);
        setInvitationsError(null);
        const res = await fetch(`/api/invitations?email=${encodeURIComponent(user.email)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load invitations");
        setInvitations(json.invitations ?? []);
      } catch (err) {
        console.error("Failed to load invitations:", err);
        setInvitations([]);
        setInvitationsError(null);
      } finally {
        setInvitationsLoading(false);
      }
    };
    fetchInvitations();

    const interval = setInterval(() => {
      fetchInvitations();
      refetchMemberships();
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.email, refetchMemberships]);

  const handleInvitationAction = async (id: string, action: "accept" | "reject") => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/invitations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, user_id: user.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Failed to ${action} invitation`);
      // Refresh invitations and memberships after accept
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
      await refetchMemberships();
      push({
        title: action === "accept" ? "Invitation accepted" : "Invitation declined",
        description:
          action === "accept"
            ? "You joined the ladder successfully."
            : "Invitation declined.",
        variant: action === "accept" ? "success" : "warning",
      });
    } catch (err) {
      push({
        title: "Action failed",
        description: err instanceof Error ? err.message : `Failed to ${action} invitation`,
        variant: "error",
      });
    }
  };

  const activityItems = useMemo(() => {
    const items: { id: string; label: string; detail: string }[] = [];
    invitations.slice(0, 3).forEach((inv) => {
      items.push({
        id: `inv-${inv.id}`,
        label: "Invitation",
        detail: inv.ladders?.name || "Ladder invitation",
      });
    });
    myPending.slice(0, 3).forEach((m: any) => {
      items.push({
        id: `pending-${m.id}`,
        label: "Join request",
        detail: m.ladders?.name || "Pending ladder join",
      });
    });
    return items.slice(0, 5);
  }, [invitations, myPending]);

  const isOrganizer = user?.role === "organizer";
  const isAdmin = user?.role === "admin";
  const isPlayer = user?.role === "player";

  // Redirect organizers to their console
  if (isOrganizer) {
    return (
      <ProtectedRoute requiredRoles={["organizer"]}>
        <div className="space-y-6">
          <PageHeader
            title="Dashboard"
            description="Welcome, Organizer! View your ladders and manage everything from here."
          />
          <div className="card p-8 text-center space-y-4">
            <p className="text-slate-600">You're being redirected to your organizer dashboard...</p>
            <Link href="/organizer" className="btn btn-primary inline-block">
              Go to My Ladders
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const headerCta = isAdmin
    ? (
        <Link href="/admin" className="btn btn-primary">
          <Settings className="h-4 w-4" />
          Admin console
        </Link>
      )
    : hasActiveLadder
    ? (
        <Link href="/challenges/create" className="btn btn-primary">
          <Swords className="h-4 w-4" />
          New challenge
        </Link>
      )
    : undefined;

  return (
    <ProtectedRoute requiredRoles={["player", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Your ladders, challenges, and rankings at a glance."
          cta={headerCta}
        />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">My Ladders</h2>

          {isLoading && (
            <div className="grid gap-3 md:grid-cols-2">
              {[1, 2].map((i) => (
                <div key={i} className="card p-5 space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          )}

          {hasError && (
            <div className="card p-4 text-sm text-red-600">Failed to load ladders or memberships.</div>
          )}

          {!isLoading && !hasError && myActive.length === 0 && (
            <div className="card space-y-3 p-5 text-center">
              <p className="text-sm font-semibold text-slate-800">No active ladders</p>
              <p className="text-sm text-slate-600">Join or browse available ladders to get started.</p>
            </div>
          )}

          {!isLoading && !hasError && myActive.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {myActive.map((membership: any) => (
                <Link
                  key={membership.id}
                  href={`/ladders/${membership.ladder_id}`}
                  className="card group p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 group-hover:text-brand-600">
                        {membership.ladders?.name}
                      </h3>
                      <p className="text-sm text-slate-600">{membership.ladders?.location || "Location TBD"}</p>
                    </div>
                    <div className="rounded-lg bg-brand-100 px-3 py-1">
                      <p className="text-sm font-bold text-brand-700">#{membership.current_rank ?? ""}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {!isLoading && !hasError && hasPendingLadder && (
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

        {!isLoading && !hasError && invitations.length > 0 && (
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleInvitationAction(invitation.id, "accept")}
                      className="btn btn-primary btn-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleInvitationAction(invitation.id, "reject")}
                      className="btn btn-secondary btn-sm"
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {invitationsLoading && (
          <div className="card p-4 text-sm text-slate-600">Loading invitations...</div>
        )}
        {invitationsError && null}

        <div className="card space-y-3 p-5">
          <div className="flex items-start gap-2">
            <Trophy className="h-4 w-4 text-brand-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Activity</p>
              <p className="text-xs text-slate-600">Invitations and join requests at a glance.</p>
            </div>
          </div>
          {activityItems.length === 0 ? (
            <p className="text-sm text-slate-600">No recent activity yet.</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {activityItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                  <span className="font-medium text-slate-900">{item.label}</span>
                  <span className="text-xs text-slate-500">{item.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
