"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Badge } from "@/components/ui/badge";
import { useLadders } from "@/features/ladders/api";
import { Loader2, MapPin, Plus, Shield, Clock, Trophy, LayoutDashboard, Search, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useEffect, useState, useMemo } from "react";
import { Avatar } from "@/components/ui/avatar";

export default function LaddersPage() {
  const { user } = useAuth();
  const { data, isLoading: laddersLoading, error, refetch } = useLadders();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [membershipLoading, setMembershipLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sportFilter, setSportFilter] = useState("all");

  const canCreateLadder = user?.role === "admin" || user?.role === "organizer";
  const ladders = data?.ladders ?? [];

  // Fetch memberships
  useEffect(() => {
    const fetchMemberships = async () => {
      if (!user) {
        setMembershipLoading(false);
        return;
      }
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

  // Derived state: Split ladders into "My Ladders" and "Explore"
  const { myLadders, exploreLadders, sportsOptions } = useMemo(() => {
    if (!ladders || membershipLoading) return { myLadders: [], exploreLadders: [], sportsOptions: [] };

    const myLadderIds = new Map(memberships.map((m: any) => [m.ladder_id, m]));

    const my = [];
    const explore = [];
    const sports = new Set<string>();

    for (const ladder of ladders) {
      if (ladder.sport_id) sports.add(ladder.sport_id);

      // Filter Logic
      const matchesSearch = !searchQuery ||
        ladder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ladder.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSport = sportFilter === "all" || ladder.sport_id === sportFilter;

      if (myLadderIds.has(ladder.id)) {
        // "My Ladder" - include membership data
        // For "My Ladders", un-filtered list is usually better? 
        // Or should we apply filters to explore only? 
        // User requested: "My Ladders on top and others listed in second section".
        // Usually "My Ladders" shouldn't change when searching "Explore". 
        // Let's keep "My Ladders" ALWAYS visible unless explicitly filtered? 
        // Actually, let's allow filtering My Ladders too, but often users expect to see them.
        // Let's include them in "My" list regardless of filter for now to ensure quick access.
        my.push({ ...ladder, membership: myLadderIds.get(ladder.id) });
      } else {
        // "Explore" - Apply filters here
        if (matchesSearch && matchesSport) {
          explore.push(ladder);
        }
      }
    }

    return {
      myLadders: my,
      exploreLadders: explore,
      sportsOptions: Array.from(sports)
    };
  }, [ladders, memberships, membershipLoading, searchQuery, sportFilter]);


  const pageLoading = laddersLoading || membershipLoading;

  if (pageLoading) {
    return (
      <ProtectedRoute>
        <div className="space-y-8 animate-pulse">
          {/* Header Skeleton */}
          <div className="h-20 bg-slate-100 rounded-lg"></div>
          {/* My Ladders Skeleton */}
          <div className="space-y-4">
            <div className="h-6 w-32 bg-slate-100 rounded"></div>
            <div className="h-32 bg-slate-100 rounded-lg"></div>
          </div>
          {/* Explore Skeleton */}
          <div className="space-y-4">
            <div className="h-10 bg-slate-100 rounded-lg"></div>
            <div className="h-40 bg-slate-100 rounded-lg"></div>
            <div className="h-40 bg-slate-100 rounded-lg"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-10 pb-20">
        <PageHeader
          title="Ladders"
          description="Join a competition or manage your active leagues."
          cta={
            canCreateLadder ? (
              <Link href="/ladders/create" className="btn btn-primary">
                <Plus className="h-4 w-4" />
                Create ladder
              </Link>
            ) : null
          }
        />

        {error && (
          <div className="card p-5 border-l-4 border-red-500 bg-red-50 text-red-700">
            Failed to load ladders. <button onClick={() => refetch()} className="underline font-semibold">Try again</button>
          </div>
        )}

        {/* SECTION 1: MY LADDERS */}
        {myLadders.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-brand-600" />
              My Ladders
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {myLadders.map((ladder: any) => (
                <div key={ladder.id} className="card p-5 hover:border-brand-300 transition-colors group relative overflow-hidden">
                  {/* Active Status Strip */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${ladder.membership.status === 'active' ? 'bg-brand-500' : 'bg-amber-400'}`} />

                  <div className="flex items-start gap-4 pl-3">
                    <div className="relative">
                      {ladder.profile_picture_url ? (
                        <img src={ladder.profile_picture_url} className="w-14 h-14 rounded-full object-cover border border-slate-100 shadow-sm" alt={ladder.name} />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center text-brand-600 font-bold text-xl border border-brand-200">
                          {ladder.name.charAt(0)}
                        </div>
                      )}
                      {ladder.membership.status === 'pending' && (
                        <div className="absolute -bottom-1 -right-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-sm">
                          Pending
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate group-hover:text-brand-700 transition-colors">
                        {ladder.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full font-medium text-slate-600">
                          {ladder.sport_id ? ladder.sport_id.charAt(0).toUpperCase() + ladder.sport_id.slice(1) : 'General'}
                        </span>
                        <span>•</span>
                        <span>{ladder.membership.status === 'active' ? 'Member' : 'Request Sent'}</span>
                      </div>
                    </div>

                    <Link href={`/ladders/${ladder.id}`} className="btn btn-sm btn-secondary self-center shrink-0">
                      Dashboard
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 2: EXPLORE */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Search className="h-5 w-5 text-slate-400" />
              Explore Ladders
            </h2>
            <div className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-full">
              {exploreLadders.length} results
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, description..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {sportsOptions.length > 0 && (
              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white min-w-[150px]"
              >
                <option value="all">All Sports</option>
                {sportsOptions.map(sport => (
                  <option key={sport} value={sport}>{sport.charAt(0).toUpperCase() + sport.slice(1)}</option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-4">
            {exploreLadders.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-500">No matching ladders found.</p>
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setSportFilter('all'); }} className="mt-2 text-brand-600 hover:underline text-sm font-medium">Clear filters</button>
                )}
              </div>
            ) : (
              exploreLadders.map((ladder: any) => (
                <div key={ladder.id} className="card p-5 group hover:border-brand-200 transition-all">
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="flex-shrink-0">
                      {ladder.profile_picture_url ? (
                        <img src={ladder.profile_picture_url} className="w-12 h-12 rounded-lg object-cover" alt={ladder.name} />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
                          {ladder.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">{ladder.name}</h3>
                        <Badge variant={ladder.status === 'active' ? 'success' : 'neutral'} className="capitalize">{ladder.status}</Badge>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2">{ladder.description || "No description provided."}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400 font-medium">
                        {ladder.sport_id && (
                          <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {ladder.sport_id.charAt(0).toUpperCase() + ladder.sport_id.slice(1)}
                          </span>
                        )}
                        {ladder.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {ladder.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                      <Link href={`/ladders/${ladder.id}`} className="btn btn-primary btn-sm whitespace-nowrap justify-center">
                        View Ladder
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {!laddersLoading && !error && ladders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No ladders available in the system yet.</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
