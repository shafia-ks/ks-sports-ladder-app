"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Badge } from "@/components/ui/badge";
import { useLadders } from "@/features/ladders/api";
import { Loader2, MapPin, Plus, Shield, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useEffect, useState } from "react";

export default function LaddersPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useLadders();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const ladders = data?.ladders ?? [];

  useEffect(() => {
    const fetchMemberships = async () => {
      if (!user) return;
      setMembershipLoading(true);
      try {
        const res = await fetch(`/api/memberships?user_id=${user.id}`);
        const data = await res.json();
        setMemberships(data.memberships || []);
      } catch (err) {
        console.error("Failed to fetch memberships:", err);
      } finally {
        setMembershipLoading(false);
      }
    };

    fetchMemberships();
  }, [user]);

  const getMembershipStatus = (ladderId: string) => {
    const membership = memberships.find((m) => m.ladder_id === ladderId);
    if (!membership) return null;
    return membership.status; // "active" | "pending"
  };

  const renderJoinButton = (ladderId: string) => {
    if (membershipLoading) {
      return (
        <button disabled className="btn btn-primary text-sm flex-1 opacity-50">
          Loading...
        </button>
      );
    }

    const status = getMembershipStatus(ladderId);

    if (status === "active") {
      return (
        <span className="btn btn-secondary text-sm flex-1 bg-success-50 border-success-200 text-success-700 cursor-default">
          ✓ Member
        </span>
      );
    }

    if (status === "pending") {
      return (
        <span className="btn btn-secondary text-sm flex-1 bg-amber-50 border-amber-200 text-amber-700 cursor-default flex items-center justify-center gap-1">
          <Clock className="h-4 w-4" />
          Pending
        </span>
      );
    }

    return (
      <Link href={`/ladders/${ladderId}`} className="btn btn-primary text-sm flex-1">
        Join
      </Link>
    );
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <PageHeader
          title="Ladders"
          description="Join a ladder and start competing with other players."
          cta={
            <Link href="/ladders/create" className="btn btn-primary">
              <Plus className="h-4 w-4" />
              Create ladder
            </Link>
          }
        />

        {isLoading && (
          <div className="card p-5 text-center text-sm text-slate-600 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading ladders...
          </div>
        )}

        {error && (
          <div className="card p-5 text-center space-y-3">
            <p className="text-sm text-red-600">Failed to load ladders.</p>
            <button className="btn btn-secondary text-sm" onClick={() => refetch()}>
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && ladders.length === 0 && (
          <div className="card p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <Plus className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800">No ladders yet.</p>
              <p className="text-sm text-slate-600">
                Create a ladder or check back once one is available to join.
              </p>
            </div>
            <div className="flex justify-center">
              <Link href="/ladders/create" className="btn btn-primary">
                <Plus className="h-4 w-4" />
                Create ladder
              </Link>
            </div>
          </div>
        )}

        {!isLoading && !error && ladders.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {ladders.map((ladder: any) => (
              <div key={ladder.id} className="card p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-900">{ladder.name}</h3>
                    <p className="text-xs text-slate-500">{ladder.description || "No description provided"}</p>
                  </div>
                  <Badge variant={ladder.status === "active" ? "success" : "neutral"}>
                    {ladder.status ?? "pending"}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  {ladder.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {ladder.location}
                    </span>
                  )}
                  {ladder.visibility && (
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {ladder.visibility}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <Link href={`/ladders/${ladder.id}`} className="btn btn-secondary text-sm flex-1">
                    View
                  </Link>
                  {renderJoinButton(ladder.id)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
