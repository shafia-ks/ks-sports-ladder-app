"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { RoleRequest } from "@/components/ui/role-request";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useLadders } from "@/features/ladders/api";
import { useMemberships } from "@/features/memberships/api";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2, Swords, AlertCircle, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: laddersData, isLoading: laddersLoading, error: laddersError } = useLadders();
  const { data: membershipsData, isLoading: membershipsLoading, error: membershipsError } = useMemberships(user?.id);

  const ladders = laddersData?.ladders ?? [];
  const myActive = membershipsData?.active ?? [];
  const myPending = membershipsData?.pending ?? [];
  const isLoading = laddersLoading || membershipsLoading;
  const hasError = laddersError || membershipsError;

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

  // Redirect admins to admin console
  if (isAdmin) {
    return (
      <ProtectedRoute requiredRoles={["admin"]}>
        <div className="space-y-6">
          <PageHeader
            title="Dashboard"
            description="Welcome, Admin! Go to the admin console to manage the system."
          />
          <div className="card p-8 text-center space-y-4">
            <p className="text-slate-600">You're being redirected to admin console...</p>
            <Link href="/admin" className="btn btn-primary inline-block">
              Go to Admin Console
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={["player"]}>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Your ladders, challenges, and rankings at a glance."
          cta={
            <Link href="/challenges/create" className="btn btn-primary">
              <Swords className="h-4 w-4" />
              New challenge
            </Link>
          }
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">My Ladders</h2>
            <Link href="/ladders" className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:border-brand-200">
              Browse all
            </Link>
          </div>

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
              <div className="flex justify-center gap-2">
                <Link href="/ladders" className="btn btn-primary text-sm">Browse ladders</Link>
              </div>
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

        {!isLoading && !hasError && myPending.length > 0 && (
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

        <RoleRequest currentRole="player" hasActivRequest={false} />
      </div>
    </ProtectedRoute>
  );
}
