"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, Clock, Swords, Target, LayoutDashboard, TrendingUp, TrendingDown, Users, CheckCircle, AlertCircle, Activity, Award, Zap } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth/auth-context";
import { StatCard } from "@/components/ui/stat-card";

interface LadderMember {
  id: string;
  user_id: string;
  current_rank: number | null;
  status: string;
  users?: {
    id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

interface LadderResponse {
  ladder: {
    id: string;
    name: string;
    description: string | null;
    location: string | null;
    visibility: string;
    status: string;
    challenge_rules: any;
    ranking_rules: any;
  } | null;
  members: LadderMember[];
  error?: string;
}

export default function LadderDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [data, setData] = useState<LadderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [tab, setTab] = useState<"dashboard" | "ranking" | "challenges" | "matches">("dashboard");
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  useEffect(() => {
    const fetchLadder = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/ladders/${params.id}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to load ladder");
        }
        setData(json);

        // Fetch dashboard stats
        if (user) {
          try {
            const statsRes = await fetch(`/api/ladders/${params.id}/dashboard-stats?userId=${user.id}`);
            if (statsRes.ok) {
              const statsJson = await statsRes.json();
              setDashboardStats(statsJson);
            }
          } catch (err) {
            console.error("Failed to load dashboard stats:", err);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ladder");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLadder();
  }, [params.id, user]);

  const handleJoinLadder = async () => {
    if (!user) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/ladders/${params.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to join ladder");
      }

      // Refresh ladder data to show pending status
      const refreshRes = await fetch(`/api/ladders/${params.id}`);
      const refreshData = await refreshRes.json();
      setData(refreshData);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to join ladder");
    } finally {
      setJoining(false);
    }
  };

  const ladderName = data?.ladder?.name ?? "Ladder";
  const members = data?.members ?? [];
  const activeMembers = members.filter((m) => m.status === "active");
  const pendingMembers = members.filter((m) => m.status === "pending");
  
  // Check current user's membership status
  const userMembership = user ? members.find((m) => m.user_id === user.id) : null;
  const currentMember = userMembership?.status === "active" ? userMembership : null;
  const isMember = userMembership?.status === "active";
  const isPending = userMembership?.status === "pending";
  
  // Check if user is organizer of this ladder
  const isOrganizer = user && currentMember ? true : false; // TODO: Add actual organizer check when ladder_leaders data is available

  const renderJoinButton = () => {
    if (!user) {
      return (
        <Link
          href="/login"
          className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold hover:border-brand-200"
        >
          Sign in to join
        </Link>
      );
    }

    if (isMember) {
      return (
        <span className="rounded-full border border-success-200 bg-success-50 px-3 py-2 text-sm font-semibold text-success-700">
          ✓ Member
        </span>
      );
    }

    if (isPending) {
      return (
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 flex items-center gap-1">
          <Clock className="h-4 w-4" />
          Pending approval
        </span>
      );
    }

    return (
      <button
        onClick={handleJoinLadder}
        disabled={joining}
        className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold hover:border-brand-200 disabled:opacity-50"
      >
        {joining ? "Joining..." : "Join ladder"}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={ladderName}
        description={data?.ladder?.description || "Ranking overview and membership."}
        cta={
          <div className="flex gap-2">
            {renderJoinButton()}
            <Link
              href={`/challenges/create?ladder=${params.id}`}
              className="rounded-full bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Challenge
            </Link>
          </div>
        }
      />

      {isLoading && (
        <div className="card p-5 text-center text-sm text-slate-600 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading ladder...
        </div>
      )}

      {error && (
        <div className="card p-5 text-center text-sm text-red-600">{error}</div>
      )}

      {!isLoading && !error && (
        <>
          {/* Tab Navigation */}
          <div className="flex gap-4 border-b border-slate-200">
            <button
              onClick={() => setTab("dashboard")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                tab === "dashboard"
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </button>
            <button
              onClick={() => setTab("ranking")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${
                tab === "ranking"
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Ranking
            </button>
            <button
              onClick={() => setTab("challenges")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                tab === "challenges"
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Swords className="h-4 w-4" />
              Challenges
            </button>
            <button
              onClick={() => setTab("matches")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                tab === "matches"
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Target className="h-4 w-4" />
              Matches
            </button>
          </div>

          {/* Dashboard Tab */}
          {tab === "dashboard" && (
            <div className="space-y-6">
              {/* Player Stats - Always Visible */}
              {currentMember && (
                <div className="card p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5 text-brand-600" />
                    My Performance
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                      label="Current Rank"
                      value={currentMember.current_rank ? `#${currentMember.current_rank}` : "-"}
                      icon={<Award className="h-5 w-5 text-brand-600" />}
                      trend={dashboardStats?.myStats?.rankChange}
                    />
                    <StatCard
                      label="Win Rate"
                      value={dashboardStats?.myStats?.winRate ? `${dashboardStats.myStats.winRate}%` : "0%"}
                      icon={<TrendingUp className="h-5 w-5 text-green-600" />}
                    />
                    <StatCard
                      label="Total Matches"
                      value={dashboardStats?.myStats?.totalMatches || 0}
                      icon={<Target className="h-5 w-5 text-blue-600" />}
                    />
                    <StatCard
                      label="Current Streak"
                      value={dashboardStats?.myStats?.streak ? `${dashboardStats.myStats.streak}W` : "-"}
                      icon={<Zap className="h-5 w-5 text-amber-600" />}
                    />
                  </div>
                </div>
              )}

              {/* Organizer Stats - Only for Organizers */}
              {isOrganizer && (
                <div className="card p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-brand-600" />
                    Ladder Management
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                      label="Total Members"
                      value={activeMembers.length}
                      icon={<Users className="h-5 w-5 text-blue-600" />}
                    />
                    <StatCard
                      label="Pending Approvals"
                      value={pendingMembers.length}
                      icon={<Clock className="h-5 w-5 text-amber-600" />}
                      alert={pendingMembers.length > 0}
                    />
                    <StatCard
                      label="Active Challenges"
                      value={dashboardStats?.organizerStats?.activeChallenges || 0}
                      icon={<Swords className="h-5 w-5 text-purple-600" />}
                    />
                    <StatCard
                      label="Recent Matches"
                      value={dashboardStats?.organizerStats?.recentMatches || 0}
                      icon={<CheckCircle className="h-5 w-5 text-green-600" />}
                    />
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    {pendingMembers.length > 0 && (
                      <Link
                        href={`/organizer/${params.id}/members`}
                        className="btn btn-primary flex items-center gap-2"
                      >
                        <Users className="h-4 w-4" />
                        Approve Members ({pendingMembers.length})
                      </Link>
                    )}
                    <Link
                      href={`/organizer/${params.id}/rankings`}
                      className="btn btn-secondary flex items-center gap-2"
                    >
                      <Award className="h-4 w-4" />
                      Manage Rankings
                    </Link>
                    <Link
                      href={`/organizer/${params.id}/matches`}
                      className="btn btn-secondary flex items-center gap-2"
                    >
                      <Target className="h-4 w-4" />
                      Manage Matches
                    </Link>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-brand-600" />
                  Recent Activity
                </h2>
                {dashboardStats?.recentActivity && dashboardStats.recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardStats.recentActivity.map((activity: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                        <div className="mt-0.5">
                          {activity.type === 'match' && <Target className="h-4 w-4 text-green-600" />}
                          {activity.type === 'challenge' && <Swords className="h-4 w-4 text-blue-600" />}
                          {activity.type === 'member' && <Users className="h-4 w-4 text-purple-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-900">{activity.description}</p>
                          <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-8">No recent activity</p>
                )}
              </div>

              {/* Top Performers */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-brand-600" />
                  Top Performers
                </h2>
                <div className="space-y-2">
                  {activeMembers.slice(0, 5).map((member, idx) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-sm">
                        {idx + 1}
                      </div>
                      <Avatar
                        name={member.users?.full_name || `${member.users?.first_name ?? ""} ${member.users?.last_name ?? ""}`}
                        email={member.users?.email}
                        src={undefined}
                        size="sm"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {member.users?.full_name || `${member.users?.first_name ?? ""} ${member.users?.last_name ?? ""}`.trim() || "Member"}
                        </p>
                        <p className="text-xs text-slate-500">Rank #{member.current_rank ?? "-"}</p>
                      </div>
                      {currentMember?.user_id !== member.user_id && (
                        <Link
                          href={`/challenges/create?ladder=${params.id}&opponent=${member.user_id}`}
                          className="text-xs font-semibold text-brand-700 hover:text-brand-800"
                        >
                          Challenge
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ranking Tab */}
          {tab === "ranking" && (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <p className="text-sm font-semibold text-slate-700">Ranking</p>
                <span className="text-xs text-slate-500">{data?.ladder?.ranking_rules?.type || "Ranking"}</span>
              </div>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Rank</th>
                    <th className="px-4 py-2">Player</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeMembers.map((member) => (
                    <tr key={member.id} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-semibold">#{member.current_rank ?? "-"}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={member.users?.full_name || `${member.users?.first_name ?? ""} ${member.users?.last_name ?? ""}`}
                            email={member.users?.email}
                            src={undefined}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-slate-900">
                              {member.users?.full_name || `${member.users?.first_name ?? ""} ${member.users?.last_name ?? ""}`.trim() || "Member"}
                            </p>
                            <p className="text-xs text-slate-500">{member.users?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          className="text-sm font-semibold text-brand-700"
                          href={`/challenges/create?ladder=${params.id}&opponent=${member.user_id}`}
                        >
                          Challenge
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Challenges Tab */}
          {tab === "challenges" && (
            <div className="py-12 text-center">
              <Swords className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-600 mb-4">View and manage challenges for this ladder</p>
              <Link
                href={`/ladders/${params.id}/challenges`}
                className="btn btn-primary inline-block"
              >
                View Challenges
              </Link>
            </div>
          )}

          {/* Matches Tab */}
          {tab === "matches" && (
            <div className="py-12 text-center">
              <Target className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-600 mb-4">View and manage matches for this ladder</p>
              <Link
                href={`/ladders/${params.id}/matches`}
                className="btn btn-primary inline-block"
              >
                View Matches
              </Link>
            </div>
          )}
        </>
      )}

      {pendingMembers.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pending Members</h2>
          <div className="space-y-2">
            {pendingMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <Avatar name={member.users?.full_name || member.users?.email || "?"} size="sm" />
                <span className="text-sm font-medium text-slate-900">
                  {member.users?.full_name || member.users?.email || "Unknown"}
                </span>
                <span className="ml-auto text-xs text-amber-700 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Awaiting approval
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
