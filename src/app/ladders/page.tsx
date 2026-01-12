"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Badge } from "@/components/ui/badge";
import { useLadders } from "@/features/ladders/api";
import { Loader2, MapPin, Plus, Shield, Clock, Trophy } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useEffect, useState } from "react";

export default function LaddersPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useLadders();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const canCreateLadder = user?.role === "admin" || user?.role === "organizer";
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
    const status = getMembershipStatus(ladderId);

    // If already a member (active), don't show any button - just View is enough
    if (status === "active") {
      return null;
    }

    if (status === "pending") {
      return (
        <span className="btn btn-secondary text-sm flex-1 bg-amber-50 border-amber-200 text-amber-700 cursor-default flex items-center justify-center gap-1">
          <Clock className="h-4 w-4" />
          Pending
        </span>
      );
    }

    // Show Join button for non-members (don't wait for loading to complete)
    return (
      <Link href={`/ladders/${ladderId}`} className="btn btn-primary text-sm flex-1">
        Join
      </Link>
    );
  };

  // Filter ladders based on search and sport
  const filteredLadders = ladders.filter((ladder: any) => {
    const matchesSearch = !searchQuery ||
      ladder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ladder.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSport = sportFilter === "all" || ladder.sport_id === sportFilter;

    return matchesSearch && matchesSport;
  });

  // Get unique sports for filter
  const availableSports = Array.from(new Set(ladders.map((l: any) => l.sport_id).filter(Boolean))) as string[];

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <PageHeader
          title="Ladders"
          description="Join a ladder and start competing with other players."
          cta={
            canCreateLadder ? (
              <Link href="/ladders/create" className="btn btn-primary">
                <Plus className="h-4 w-4" />
                Create ladder
              </Link>
            ) : null
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
            {canCreateLadder && (
              <div className="flex justify-center">
                <Link href="/ladders/create" className="btn btn-primary">
                  <Plus className="h-4 w-4" />
                  Create ladder
                </Link>
              </div>
            )}
          </div>
        )}

        {!isLoading && !error && ladders.length > 0 && (
          <>
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative flex-1 w-full">
                <input
                  type="search"
                  placeholder="Search ladders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {availableSports.length > 0 && (
                <select
                  value={sportFilter}
                  onChange={(e) => setSportFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="all">All Sports</option>
                  {availableSports.map((sport: string) => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Ladders List - Vertical Stack */}
            <div className="space-y-4">
              {filteredLadders.length === 0 ? (
                <div className="card p-8 text-center text-slate-500">
                  <p className="text-sm">No ladders found matching your criteria.</p>
                  <button
                    onClick={() => { setSearchQuery(""); setSportFilter("all"); }}
                    className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                filteredLadders.map((ladder: any) => (
                  <div key={ladder.id} className="card p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Ladder Avatar */}
                        <div className="flex-shrink-0">
                          {ladder.profile_picture_url ? (
                            <img
                              src={ladder.profile_picture_url}
                              alt={ladder.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
                              onError={(e) => {
                                // Fallback to default icon if image fails to load
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-lg ${ladder.profile_picture_url ? 'hidden' : ''}`}>
                            {ladder.name.charAt(0).toUpperCase()}
                          </div>
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-slate-900">{ladder.name}</h3>
                            {ladder.sport_id && (
                              <Badge variant="info">
                                <Trophy className="h-3 w-3 mr-1" />
                                {ladder.sport_id}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{ladder.description || "No description provided"}</p>
                        </div>
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
                      <Link href={`/ladders/${ladder.id}`} className={`btn btn-secondary text-sm ${getMembershipStatus(ladder.id) === "active" ? "flex-1" : "flex-1"}`}>
                        View
                      </Link>
                      {getMembershipStatus(ladder.id) !== "active" && renderJoinButton(ladder.id)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
