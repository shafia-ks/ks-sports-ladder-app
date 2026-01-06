"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, Clock, Swords, Target, LayoutDashboard, TrendingUp, TrendingDown, Users, CheckCircle, AlertCircle, Activity, Award, Zap, X, Calendar, MapPin, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth/auth-context";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";

const SPORT_LABELS: Record<string, string> = {
  squash: "Squash",
  tennis: "Tennis",
  badminton: "Badminton",
  racquetball: "Racquetball",
  pickleball: "Pickleball",
};

const formatSport = (sport?: string | null) => {
  if (!sport) return "Not set";
  const key = sport.toLowerCase();
  return SPORT_LABELS[key] || sport;
};

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
    role?: "player" | "organizer" | "admin";
  } | null;
}

interface LadderResponse {
  ladder: {
    id: string;
    name: string;
    description: string | null;
    sport_id?: string | null;
    location: string | null;
    visibility: string;
    status: string;
    challenge_rules: any;
    ranking_rules: any;
  } | null;
  members: LadderMember[];
  organizerIds?: string[];
  organizers?: Array<{
    id: string;
    full_name: string | null;
    email: string | null;
    role: "player" | "organizer" | "admin";
  }>;
  memberCounts?: { active: number; pending: number };
  challengeCounts?: { active: number };
  matchCounts?: { confirmed: number };
  error?: string;
}

interface Challenge {
  id: string;
  ladder_id: string;
  challenger_id: string;
  challenged_id: string;
  status: string;
  scheduled_at: string | null;
  location: string | null;
  notes: string | null;
  expires_at: string | null;
  created_at: string;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  counter_proposal_time: string | null;
  counter_proposal_location: string | null;
  challenger?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  challenged?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

function ChallengesTabContent({ ladderId, userId }: { ladderId: string; userId?: string }) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCounterProposal, setShowCounterProposal] = useState<string | null>(null);
  const [counterProposal, setCounterProposal] = useState({
    time: "",
    location: "",
    notes: "",
  });

  useEffect(() => {
    fetchChallenges();
  }, [ladderId]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const url = userId 
        ? `/api/challenges?ladderId=${ladderId}&userId=${userId}`
        : `/api/challenges?ladderId=${ladderId}`;
      const res = await fetch(url);
      const data = await res.json();
      setChallenges(data.challenges || []);
    } catch (err) {
      console.error("Failed to load challenges:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (challengeId: string) => {
    try {
      const res = await fetch(`/api/challenges/${challengeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Accepted" }),
      });
      if (res.ok) {
        fetchChallenges();
      }
    } catch (err) {
      console.error("Failed to accept challenge:", err);
    }
  };

  const handleDecline = async (challengeId: string) => {
    try {
      const res = await fetch(`/api/challenges/${challengeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Declined" }),
      });
      if (res.ok) {
        fetchChallenges();
      }
    } catch (err) {
      console.error("Failed to decline challenge:", err);
    }
  };

  const handleCancel = async (challengeId: string) => {
    if (!cancelReason.trim()) {
      alert("Please provide a cancellation reason");
      return;
    }
    
    try {
      setCancelling(challengeId);
      const res = await fetch(`/api/challenges/${challengeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "Cancelled", 
          cancellation_reason: cancelReason,
          cancelled_by: userId 
        }),
      });
      if (res.ok) {
        setShowCancelModal(null);
        setCancelReason("");
        fetchChallenges();
      }
    } catch (err) {
      console.error("Failed to cancel challenge:", err);
    } finally {
      setCancelling(null);
    }
  };

  const handleCounterProposal = async (challengeId: string) => {
    if (!counterProposal.time && !counterProposal.location) {
      alert("Please provide at least a new time or location");
      return;
    }

    try {
      const res = await fetch(`/api/challenges/${challengeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counter_proposal_time: counterProposal.time || null,
          counter_proposal_location: counterProposal.location || null,
          counter_proposal_notes: counterProposal.notes || null,
        }),
      });
      if (res.ok) {
        setShowCounterProposal(null);
        setCounterProposal({ time: "", location: "", notes: "" });
        fetchChallenges();
        alert("Counter-proposal sent!");
      }
    } catch (err) {
      console.error("Failed to send counter-proposal:", err);
    }
  };

  const getTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    if (diff < 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h remaining`;
    const days = Math.floor(hours / 24);
    return `${days}d remaining`;
  };

  const activeChallenges = challenges.filter(c => c.status === "Pending" || c.status === "Accepted");
  const pastChallenges = challenges.filter(c => c.status === "Completed" || c.status === "Declined" || c.status === "Expired" || c.status === "Cancelled").slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Challenges */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Swords className="h-5 w-5 text-brand-600" />
            Active Challenges ({activeChallenges.length})
          </h3>
          <Link href="/challenges/create" className="btn btn-sm btn-primary">
            <Swords className="h-4 w-4" />
            New Challenge
          </Link>
        </div>

        {activeChallenges.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No active challenges</p>
        ) : (
          <div className="space-y-3">
            {activeChallenges.map((challenge) => {
              const isChallenger = challenge.challenger_id === userId;
              const opponent = isChallenger ? challenge.challenged : challenge.challenger;
              const canCancel = isChallenger && challenge.status === "Pending";
              
              return (
                <div key={challenge.id} className="border border-slate-200 rounded-lg p-4 hover:border-brand-300 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar 
                        name={opponent?.full_name || opponent?.email || "?"}
                        email={opponent?.email}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        {challenge.counter_proposal_time && (
                          <div className="flex items-center gap-1 text-xs text-brand-600 mb-1 bg-brand-50 px-2 py-1 rounded">
                            <Calendar className="h-3 w-3" />
                            Counter-proposal: {new Date(challenge.counter_proposal_time).toLocaleString()}
                            {challenge.counter_proposal_location && ` at ${challenge.counter_proposal_location}`}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-slate-900">
                            {isChallenger ? "You challenged" : "Challenged you"}:  {opponent?.full_name || opponent?.email}
                          </p>
                          <StatusBadge status={challenge.status} />
                        </div>
                        
                        {challenge.scheduled_at && (
                          <div className="flex items-center gap-1 text-xs text-slate-600 mb-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(challenge.scheduled_at).toLocaleString()}
                          </div>
                        )}
                        
                        {challenge.location && (
                          <div className="flex items-center gap-1 text-xs text-slate-600 mb-1">
                            <MapPin className="h-3 w-3" />
                            {challenge.location}
                          </div>
                        )}
                        
                        {challenge.notes && (
                          <div className="flex items-center gap-1 text-xs text-slate-600 mb-1">
                            <MessageSquare className="h-3 w-3" />
                            {challenge.notes}
                          </div>
                        )}

                        {challenge.status === "Pending" && challenge.expires_at && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 mt-2">
                            <Clock className="h-3 w-3" />
                            {getTimeRemaining(challenge.expires_at)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isChallenger && challenge.status === "Pending" && (
                        <>
                          <button
                            onClick={() => setShowCounterProposal(challenge.id)}
                            className="btn btn-sm border border-brand-300 text-brand-700 hover:bg-brand-50"
                          >
                            Counter
                          </button>
                          <button
                            onClick={() => handleAccept(challenge.id)}
                            className="btn btn-sm btn-primary"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDecline(challenge.id)}
                            className="btn btn-sm border border-slate-300 text-slate-700 hover:bg-slate-50"
                          >
                            Decline
                          </button>
                        </>
                      )}
                      
                      {canCancel && (
                        <button
                          onClick={() => setShowCancelModal(challenge.id)}
                          className="btn btn-sm border border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Challenges */}
      {pastChallenges.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-slate-600" />
            Recent History
          </h3>
          <div className="space-y-2">
            {pastChallenges.map((challenge) => {
              const isChallenger = challenge.challenger_id === userId;
              const opponent = isChallenger ? challenge.challenged : challenge.challenger;
              
              return (
                <div key={challenge.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <Avatar 
                      name={opponent?.full_name || opponent?.email || "?"}
                      email={opponent?.email}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {isChallenger ? "vs" : "from"} {opponent?.full_name || opponent?.email}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(challenge.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {challenge.status === "Cancelled" && challenge.cancellation_reason && (
                      <span className="text-xs text-slate-600 italic max-w-xs truncate">
                        "{challenge.cancellation_reason}"
                      </span>
                    )}
                    <StatusBadge status={challenge.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Cancel Challenge</h3>
            <p className="text-sm text-slate-600 mb-4">
              Please provide a reason for cancelling this challenge. This helps maintain transparency.
            </p>
            
            <div className="space-y-3 mb-6">
              {["Injury", "Schedule Conflict", "Not Available", "Other"].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setCancelReason(reason)}
                  className={`w-full text-left px-4 py-2 rounded-lg border transition ${
                    cancelReason === reason
                      ? "border-brand-600 bg-brand-50 text-brand-900"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            {cancelReason === "Other" && (
              <textarea
                placeholder="Please specify..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4"
                rows={3}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(null);
                  setCancelReason("");
                }}
                className="flex-1 btn border border-slate-300 text-slate-700 hover:bg-slate-50"
                disabled={cancelling !== null}
              >
                Back
              </button>
              <button
                onClick={() => handleCancel(showCancelModal)}
                className="flex-1 btn bg-red-600 text-white hover:bg-red-700"
                disabled={!cancelReason.trim() || cancelling !== null}
              >
                {cancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Confirm Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counter Proposal Modal */}
      {showCounterProposal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Counter Proposal</h3>
            <p className="text-sm text-slate-600 mb-4">
              Suggest an alternative time or location for this challenge.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">
                  Proposed Time
                </label>
                <input
                  type="datetime-local"
                  value={counterProposal.time}
                  onChange={(e) =>
                    setCounterProposal({ ...counterProposal, time: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">
                  Proposed Location
                </label>
                <input
                  type="text"
                  value={counterProposal.location}
                  onChange={(e) =>
                    setCounterProposal({ ...counterProposal, location: e.target.value })
                  }
                  placeholder="Alternative location"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={counterProposal.notes}
                  onChange={(e) =>
                    setCounterProposal({ ...counterProposal, notes: e.target.value })
                  }
                  placeholder="Additional details..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCounterProposal(null);
                  setCounterProposal({ time: "", location: "", notes: "" });
                }}
                className="flex-1 btn border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCounterProposal(showCounterProposal)}
                className="flex-1 btn btn-primary"
                disabled={!counterProposal.time && !counterProposal.location}
              >
                Send Proposal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LadderDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [data, setData] = useState<LadderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [tab, setTab] = useState<"dashboard" | "ranking" | "challenges" | "matches">("dashboard");
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [fixingRanks, setFixingRanks] = useState(false);

  const fetchLadder = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (user?.id) {
        headers["x-user-id"] = user.id;
      }

      const res = await fetch(`/api/ladders/${params.id}`, { headers });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to load ladder");
      }
      setData(json);

      const canAccessStats =
        user &&
        (json.organizerIds?.includes(user.id) ||
          json.members?.some((m: LadderMember) => m.user_id === user.id && m.status === "active") ||
          user.role === "admin");

      if (canAccessStats) {
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

  useEffect(() => {
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
      const refreshRes = await fetch(`/api/ladders/${params.id}`, {
        headers: user?.id ? { 'x-user-id': user.id } : {}
      });
      const refreshData = await refreshRes.json();
      setData(refreshData);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to join ladder");
    } finally {
      setJoining(false);
    }
  };

  const handleFixRanks = async () => {
    setFixingRanks(true);
    try {
      const res = await fetch(`/api/ladders/${params.id}/fix-ranks`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to fix ranks");
      }
      await fetchLadder();
      alert(json.message || "Ranks updated");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to fix ranks");
    } finally {
      setFixingRanks(false);
    }
  };

  const ladderName = data?.ladder?.name ?? "Ladder";
  const members = data?.members ?? [];
  const activeMembers = members.filter((m) => m.status === "active");
  const pendingMembers = members.filter((m) => m.status === "pending");
  const organizerIds = data?.organizerIds ?? [];
  const memberCounts = data?.memberCounts ?? { active: activeMembers.length, pending: pendingMembers.length };
  const challengeCounts = data?.challengeCounts ?? { active: 0 };
  const matchCounts = data?.matchCounts ?? { confirmed: 0 };
  const hasZeroRanks = activeMembers.some((m) => !m.current_rank || m.current_rank <= 0);
  const activeMembersSorted = [...activeMembers].sort((a, b) => {
    const rankA = a.current_rank && a.current_rank > 0 ? a.current_rank : Number.MAX_SAFE_INTEGER;
    const rankB = b.current_rank && b.current_rank > 0 ? b.current_rank : Number.MAX_SAFE_INTEGER;
    return rankA - rankB;
  });
  
  // Check current user's membership status
  const userMembership = user ? members.find((m) => m.user_id === user.id) : null;
  const currentMember = userMembership?.status === "active" ? userMembership : null;
  const isMember = userMembership?.status === "active";
  const isPending = userMembership?.status === "pending";
  
  // Check if user is organizer/admin for this ladder
  const isOrganizer = user ? user.role === "admin" || organizerIds.includes(user.id) : false;
  const canAccessMembers = isMember || isOrganizer;

  // Prevent non-members from navigating to member-only tabs
  useEffect(() => {
    if (!canAccessMembers && tab !== "dashboard") {
      setTab("dashboard");
    }
  }, [canAccessMembers, tab]);

  const getMemberRole = (member: LadderMember) => {
    if (member.users?.role === "admin") return "Admin";
    if (organizerIds.includes(member.user_id)) return "Organizer";
    return "Player";
  };

  const renderRolePill = (role: string) => (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
      {role}
    </span>
  );

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
            {isMember && (
              <Link
                href={`/challenges/create?ladder=${params.id}`}
                className="rounded-full bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Challenge
              </Link>
            )}
          </div>
        }
      />

      {data?.ladder && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          {data.ladder.sport_id && (
            <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold uppercase tracking-wide text-[11px]">
              {formatSport(data.ladder.sport_id)}
            </span>
          )}
          {data.ladder.location && <span className="px-2 py-1 rounded-full bg-slate-50">📍 {data.ladder.location}</span>}
          <span className="px-2 py-1 rounded-full bg-slate-50">Visibility: {data.ladder.visibility}</span>
          <span className="px-2 py-1 rounded-full bg-slate-50">Status: {data.ladder.status}</span>
        </div>
      )}

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
            {canAccessMembers && (
              <>
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
              </>
            )}
          </div>

          {/* Dashboard Tab */}
          {tab === "dashboard" && (
            <div className="space-y-6">
              {!isMember && (
                <div className="card p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-brand-600" />
                    About this ladder
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-slate-50">
                      <p className="text-xs text-slate-500">Status</p>
                      <p className="text-sm font-semibold text-slate-900">{data?.ladder?.status || "Unknown"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50">
                      <p className="text-xs text-slate-500">Visibility</p>
                      <p className="text-sm font-semibold text-slate-900">{data?.ladder?.visibility || "private"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50">
                      <p className="text-xs text-slate-500">Location</p>
                      <p className="text-sm font-semibold text-slate-900">{data?.ladder?.location || "Not set"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50">
                      <p className="text-xs text-slate-500">Sport</p>
                      <p className="text-sm font-semibold text-slate-900">{formatSport(data?.ladder?.sport_id)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-white border border-slate-100">
                      <p className="text-xs text-slate-500">Active members</p>
                      <p className="text-lg font-semibold text-slate-900">{memberCounts.active}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white border border-slate-100">
                      <p className="text-xs text-slate-500">Pending requests</p>
                      <p className="text-lg font-semibold text-slate-900">{memberCounts.pending}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white border border-slate-100">
                      <p className="text-xs text-slate-500">Active challenges</p>
                      <p className="text-lg font-semibold text-slate-900">{challengeCounts.active}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white border border-slate-100">
                      <p className="text-xs text-slate-500">Confirmed matches</p>
                      <p className="text-lg font-semibold text-slate-900">{matchCounts.confirmed}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">
                    Join to view rankings, members, and challenges. {isPending ? "Your request is awaiting approval." : ""}
                  </p>
                </div>
              )}

              {/* Organizers List - Always Visible */}
              {organizerIds.length > 0 && (
                <div className="card p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-brand-600" />
                    Ladder Organizers
                  </h2>
                  <div className="space-y-2">
                    {(data?.organizers || []).map((organizer) => (
                        <div
                          key={organizer.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                        >
                          <Avatar name={organizer.full_name || organizer.email || "?"} size="sm" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">
                              {organizer.full_name || organizer.email}
                            </p>
                            {organizer.email && organizer.full_name && (
                              <p className="text-xs text-slate-500">{organizer.email}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {organizer.role === "admin" && renderRolePill("Admin")}
                            {renderRolePill("Organizer")}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

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

              {/* Organizer Stats - Only for Organizers/Admins */}
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
              {canAccessMembers && (
                <>
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

                  <div className="card p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Award className="h-5 w-5 text-brand-600" />
                      Top Performers
                    </h2>
                    <div className="space-y-2">
                      {activeMembersSorted.slice(0, 5).map((member, idx) => (
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
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-slate-500">Rank #{member.current_rank ?? "-"}</p>
                              {renderRolePill(getMemberRole(member))}
                            </div>
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
                </>
              )}
            </div>
          )}

          {/* Ranking Tab */}
          {tab === "ranking" && canAccessMembers && (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-slate-700">Ranking</p>
                  <span className="text-xs text-slate-500">{data?.ladder?.ranking_rules?.type || "Ranking"}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isOrganizer && hasZeroRanks && (
                    <button
                      onClick={handleFixRanks}
                      disabled={fixingRanks}
                      className="btn btn-xs border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                    >
                      {fixingRanks ? "Fixing..." : "Fix ranks"}
                    </button>
                  )}
                  {isOrganizer && (
                    <Link
                      href={`/organizer/${params.id}/rankings`}
                      className="btn btn-xs border border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Edit rankings
                    </Link>
                  )}
                </div>
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
                  {activeMembersSorted.map((member) => (
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
                            <div className="mt-1">{renderRolePill(getMemberRole(member))}</div>
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
          {tab === "challenges" && canAccessMembers && (
            <ChallengesTabContent ladderId={params.id} userId={user?.id} />
          )}

          {/* Matches Tab */}
          {tab === "matches" && canAccessMembers && (
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

      {isOrganizer && pendingMembers.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pending Members</h2>
          <div className="space-y-2">
            {pendingMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <Avatar name={member.users?.full_name || member.users?.email || "?"} size="sm" />
                <span className="text-sm font-medium text-slate-900">
                  {member.users?.full_name || member.users?.email || "Unknown"}
                </span>
                {renderRolePill(getMemberRole(member))}
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
