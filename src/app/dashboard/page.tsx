"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { RoleRequest } from "@/components/ui/role-request";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useLadders } from "@/features/ladders/api";
import { useMemberships } from "@/features/memberships/api";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2, Swords, AlertCircle } from "lucide-react";
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

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Your ladders, challenges, and admin tasks in one place."
          cta={
            <Link href="/challenges/create" className="btn btn-primary">
              <Swords className="h-4 w-4" />
              New challenge
            </Link>
          }
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">My ladders</h2>
            <div className="flex gap-2 text-xs text-slate-500">
              <Link href="/ladders/create" className="rounded-full bg-brand-50 px-2 py-1 font-semibold text-brand-700">
                Create
              </Link>
              <Link href="/ladders" className="rounded-full border border-slate-200 px-2 py-1 font-semibold text-slate-700 hover:border-brand-200">
                Browse
              </Link>
            </div>
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
              <p className="text-sm font-semibold text-slate-800">No ladders yet</p>
              <p className="text-sm text-slate-600">Join or create a ladder to get started.</p>
              <div className="flex justify-center gap-2">
                <Link href="/ladders/create" className="btn btn-primary text-sm">Create ladder</Link>
                <Link href="/ladders" className="btn btn-secondary text-sm">Browse ladders</Link>
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
