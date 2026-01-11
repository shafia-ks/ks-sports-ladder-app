"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, Clock, Swords, Target, LayoutDashboard, TrendingUp, TrendingDown, Users, CheckCircle, AlertCircle, Activity, Award, Zap, X, Calendar, MapPin, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/components/ui/toast";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleRequest } from "@/components/ui/role-request";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useAnalytics } from "@/lib/analytics/tracker";

// Extracted components
import { HeroStats } from "@/features/ladders/components/dashboard/HeroStats";
import { Top5Rankings } from "@/features/ladders/components/dashboard/Top5Rankings";
import { LadderInfoSidebar } from "@/features/ladders/components/dashboard/LadderInfoSidebar";
import { RecentActivity } from "@/features/ladders/components/dashboard/RecentActivity";
import { OrganizerActionBanner } from "@/features/ladders/components/dashboard/OrganizerActionBanner";
import { OrganizerStatsGrid } from "@/features/ladders/components/dashboard/OrganizerStatsGrid";
import { MyActiveChallengesCard } from "@/features/ladders/components/dashboard/MyActiveChallengesCard";
import { MyActiveMatchesCard } from "@/features/ladders/components/dashboard/MyActiveMatchesCard";
import { LadderChallengesCard } from "@/features/ladders/components/dashboard/LadderChallengesCard";
import { LadderMatchesCard } from "@/features/ladders/components/dashboard/LadderMatchesCard";
import { PendingApprovals } from "@/features/ladders/components/PendingApprovals";
import { InviteMembersButton } from "@/features/ladders/components/InviteMembersButton";
import { InviteMembersModal } from "@/features/ladders/components/InviteMembersModal";
import { PendingOrganizerRequests } from "@/features/ladders/components/PendingOrganizerRequests";
import { MatchesList } from "@/features/ladders/components/MatchesList";
import { useLadderRealtime } from "@/hooks/useLadderRealtime";

// Lazy load heavy components for better performance
const RankingsTable = dynamic(
  () => import("@/features/ladders/components/RankingsTable").then(mod => ({ default: mod.RankingsTable })),
  {
    loading: () => (
      <div className="card p-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-3 bg-slate-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    ssr: false
  }
);



// Extracted hooks and utilities
import { useLadderData } from "@/features/ladders/hooks/useLadderData";
import { useLadderActions } from "@/features/ladders/hooks/useLadderActions";
import { useLadderMembers } from "@/features/ladders/hooks/useLadderMembers";
import { canChallenge as canChallengeUtil } from "@/features/ladders/utils/challengeRules";

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
  is_busy?: boolean;
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
  const { push: toastPush } = useToast();
  const { trackEvent } = useAnalytics();
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
        trackEvent({ action: 'challenge_accepted', category: 'engagement', label: ladderId });
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
        trackEvent({ action: 'challenge_declined', category: 'engagement', label: ladderId });
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
        trackEvent({ action: 'challenge_cancelled', category: 'engagement', label: ladderId });
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
    <div className="space-y-6 relative">
      {/* Active Challenges */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Swords className="h-5 w-5 text-brand-600" />
            Active Challenges ({activeChallenges.length})
          </h3>

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
                  className={`w-full text-left px-4 py-2 rounded-lg border transition ${cancelReason === reason
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
  // Toast state for feedback (must be first)
  const { push: toastPush } = useToast();
  const { trackEvent } = useAnalytics();
  // State for pending member approval UI
  const [pendingSearch, setPendingSearch] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [hasPendingOrganizerRequest, setHasPendingOrganizerRequest] = useState(false);
  const [busyPlayers, setBusyPlayers] = useState<Set<string>>(new Set());

  // Approve member handler
  const handleApproveMember = async (memberId: string) => {
    setApprovingId(memberId);
    try {
      const res = await fetch(`/api/ladders/${params.id}/members/${memberId}/approve`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to approve member");
      toastPush({ title: "Member approved!", variant: "success" });
      await fetchLadder(true); // Silent refetch - no loading state
    } catch (err) {
      toastPush({ title: "Failed to approve member", description: err instanceof Error ? err.message : "Undefined error", variant: "error" });
    } finally {
      setApprovingId(null);
    }
  };

  // Reject member handler
  const handleRejectMember = async (memberId: string) => {
    setRejectingId(memberId);
    try {
      const res = await fetch(`/api/ladders/${params.id}/members/${memberId}/reject`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to reject member");
      toastPush({ title: "Member rejected.", variant: "success" });
      await fetchLadder(true); // Silent refetch - no loading state
    } catch (err) {
      toastPush({ title: "Failed to reject member", description: err instanceof Error ? err.message : "Undefined error", variant: "error" });
    } finally {
      setRejectingId(null);
    }
  };



  const { user, isLoading: authLoading } = useAuth();

  // Use custom hooks for data fetching
  const { data, isLoading, error, refetch: fetchLadder } = useLadderData(params.id, user?.id);

  // Real-time subscriptions for instant updates
  useLadderRealtime({
    ladderId: params.id,
    onChallengeChange: () => {
      console.log('[Dashboard] Challenge changed, refetching...');
      fetchLadder(true); // Silent refetch
    },
    onMatchChange: () => {
      console.log('[Dashboard] Match changed, refetching...');
      fetchLadder(true); // Silent refetch
    },
    onRankingChange: () => {
      console.log('[Dashboard] Ranking changed, refetching...');
      fetchLadder(true); // Silent refetch
    },
    enabled: !!data, // Only enable after initial load
  });

  // Use custom hooks for actions
  const actions = useLadderActions(params.id, fetchLadder);
  const { joining, approveMember, rejectMember, joinLadder } = actions;

  // Use custom hooks for member management
  const memberData = useLadderMembers(data?.members || [], user?.id);
  const {
    activeMembers,
    pendingMembers,
    activeMembersSorted,
    isMember,
    isPending,
    currentUserRank,
    currentMember
  } = memberData;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize tab from URL parameter or default to dashboard
  const initialTab = (searchParams?.get('tab') as "dashboard" | "ranking" | "challenges" | "matches" | "settings") || "dashboard";
  const [tab, setTab] = useState<"dashboard" | "ranking" | "challenges" | "matches" | "settings">(initialTab);

  // Update tab when URL parameter changes
  useEffect(() => {
    const urlTab = searchParams?.get('tab') as "dashboard" | "ranking" | "challenges" | "matches" | "settings" | null;
    if (urlTab && urlTab !== tab) {
      setTab(urlTab);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (newTab: "dashboard" | "ranking" | "challenges" | "matches" | "settings") => {
    setTab(newTab);
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (newTab === "dashboard") {
      params.delete('tab');
    } else {
      params.set('tab', newTab);
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : (pathname || '');
    router.push(newUrl as any, { scroll: false });
  };
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [fixingRanks, setFixingRanks] = useState(false);
  const [settingsForms, setSettingsForms] = useState({
    description: "",
    location: "",
    visibility: "public" as "public" | "private",
    rankingType: "default-swap-minimal-drop",
    kFactor: 24,
    maxDrop: 1,
    maxPositionsUp: 3,
    expiryDays: 7,
    cooldownHours: 0,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id || !data?.ladder) return;

      const canAccessStats =
        data.members?.some((m: any) => m.user_id === user.id && m.status === "active") ||
        data.organizerIds?.includes(user.id);

      if (!canAccessStats) return;

      try {
        const res = await fetch(`/api/ladders/${params.id}/dashboard-stats?userId=${user.id}`);
        if (res.ok) {
          const json = await res.json();
          setDashboardStats(json);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      }
    };

    fetchStats();
  }, [params.id, user?.id, data]);

  // Top-level useEffect for settingsForms initialization
  useEffect(() => {
    if (data && data.ladder) {
      setSettingsForms((prev) => ({
        ...prev,
        description: data.ladder?.description || "",
        location: data.ladder?.location || "",
        visibility: (data.ladder?.visibility === "private" ? "private" : "public"),
        rankingType: data.ladder?.ranking_rules?.type || "default-swap-minimal-drop",
        kFactor: typeof data.ladder?.ranking_rules?.kFactor === "number" ? data.ladder.ranking_rules.kFactor : 24,
        maxDrop: typeof data.ladder?.ranking_rules?.maxDrop === "number" ? data.ladder.ranking_rules.maxDrop : 1,
        maxPositionsUp: typeof data.ladder?.challenge_rules?.max_positions_up === "number" ? data.ladder.challenge_rules.max_positions_up : 3,
        expiryDays: typeof data.ladder?.challenge_rules?.expiry_days === "number" ? data.ladder.challenge_rules.expiry_days : 7,
        cooldownHours: typeof data.ladder?.challenge_rules?.cooldown_hours === "number" ? data.ladder.challenge_rules.cooldown_hours : 0,
      }));
    }
  }, [data]);

  // Check if user has a pending organizer request for this ladder
  useEffect(() => {
    const checkOrganizerRequest = async () => {
      if (!user?.id || !params.id) return;

      try {
        const res = await fetch(`/api/leader-requests?user_id=${user.id}&ladder_id=${params.id}&status=pending`);
        if (res.ok) {
          const json = await res.json();
          setHasPendingOrganizerRequest((json.requests || []).length > 0);
        }
      } catch (err) {
        console.error("Failed to check organizer request:", err);
      }
    };

    checkOrganizerRequest();
  }, [user?.id, params.id]);

  // Fetch active challenges to determine busy players
  const fetchActiveChallenges = async () => {
    if (!params.id) return;

    try {
      const res = await fetch(`/api/challenges?ladderId=${params.id}`);
      if (res.ok) {
        const json = await res.json();
        const challenges = json.challenges || [];

        // Find all players involved in Pending or Accepted challenges
        const busy = new Set<string>();
        challenges.forEach((challenge: any) => {
          if (challenge.status === "Pending" || challenge.status === "Accepted") {
            busy.add(challenge.challenger_id);
            busy.add(challenge.challenged_id);
          }
        });

        setBusyPlayers(busy);
      }
    } catch (err) {
      console.error("Failed to fetch challenges:", err);
    }
  };

  useEffect(() => {
    fetchActiveChallenges();
    // Refetch every 30 seconds to keep status updated
    const interval = setInterval(fetchActiveChallenges, 30000);
    return () => clearInterval(interval);
  }, [params.id]);



  const handleJoinLadder = async () => {
    if (!user) return;
    try {
      await joinLadder(user.id);
      trackEvent({ action: 'ladder_joined', category: 'growth', label: params.id });

      // Refresh ladder data to update UI
      await fetchLadder(true); // Silent refetch

      // Show success message
      toastPush({
        title: "Joined ladder!",
        description: "You have successfully joined the ladder.",
        variant: "success",
      });
    } catch (err) {
      toastPush({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to join ladder",
        variant: "error",
      });
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

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericFields = ["kFactor", "maxDrop", "maxPositionsUp", "expiryDays", "cooldownHours"];
    setSettingsForms((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? parseInt(value) : value,
    }));
  };

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsError(null);
    setSettingsSuccess(null);
    try {
      const payload = {
        description: settingsForms.description,
        location: settingsForms.location,
        visibility: settingsForms.visibility,
        ranking_rules: {
          type: settingsForms.rankingType,
          kFactor: settingsForms.kFactor || undefined,
          maxDrop: settingsForms.maxDrop || undefined,
        },
        challenge_rules: {
          max_positions_up: settingsForms.maxPositionsUp,
          expiry_days: settingsForms.expiryDays,
          cooldown_hours: settingsForms.cooldownHours,
        },
      };

      const res = await fetch(`/api/ladders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update ladder");

      setSettingsSuccess("Settings updated");
      setIsEditingSettings(false);
      await fetchLadder();
      setTimeout(() => setSettingsSuccess(null), 3000);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Failed to update settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleQuickChallenge = async (challengedMemberId: string) => {
    if (!user || !data?.ladder) {
      alert("Please log in first");
      return;
    }

    const challengedMember = activeMembers.find((m) => m.user_id === challengedMemberId);
    const maxPositionsUp = data.ladder.challenge_rules?.max_positions_up ?? 3;

    if (!challengedMember) {
      alert("Member not found");
      return;
    }

    // Validation: Only lower-ranked players can challenge higher-ranked players
    // In ladder rankings: rank #1 is BETTER than rank #3
    // So a player at rank #3 can challenge rank #1 or #2 (lower numbers = better ranks)
    if (!currentMember?.current_rank || !challengedMember.current_rank) {
      alert("Invalid ranks");
      return;
    }

    // Current user must have HIGHER rank number (worse position) to challenge upward
    // Example: rank #3 (current) can challenge rank #1 (target) because 3 > 1
    if (currentMember.current_rank <= challengedMember.current_rank) {
      alert("You can only challenge players ranked above you");
      return;
    }

    // Check max positions up rule
    const positionsUp = currentMember.current_rank - challengedMember.current_rank;
    if (positionsUp > maxPositionsUp) {
      alert(`You can only challenge up to ${maxPositionsUp} positions above your current rank`);
      return;
    }

    // Check if challenged player is busy
    if (challengedMember.is_busy) {
      alert("This player is currently engaged in an ongoing challenge or match");
      return;
    }

    // Check if current player is busy
    if (currentMember.is_busy) {
      toastPush({
        title: "Cannot send challenge",
        description: "You already have an ongoing challenge or pending match",
        variant: "warning",
      });
      return;
    }

    try {
      const payload = {
        ladderId: params.id,
        challengerId: user.id,
        challengedId: challengedMemberId,
        challengerRank: currentMember.current_rank,
        challengedRank: challengedMember.current_rank,
        challengerActiveChallenges: 0,
        challengedActiveChallenges: 0,
        challengerBusy: currentMember.is_busy || false,
        challengedBusy: challengedMember.is_busy || false,
        rules: {
          maxPositionsUp,
          preventChallengingBusyPlayers: true,
          maxActiveChallengesPerPlayer: data.ladder.challenge_rules?.max_active_challenges_per_player || 3,
          expiryDays: data.ladder.challenge_rules?.expiry_days || 7,
          cooldownHours: data.ladder.challenge_rules?.cooldown_hours || 0,
        },
      };

      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.errors?.[0]?.message || "Failed to create challenge");
      }

      toastPush({
        title: "Challenge sent!",
        variant: "success",
      });
      trackEvent({ action: 'challenge_created', category: 'engagement', label: params.id });
      await fetchLadder();
      await fetchActiveChallenges();
    } catch (err) {
      toastPush({
        title: "Failed to send challenge",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "error",
      });
    }
  };

  const handleCancelSettings = () => {
    if (data?.ladder) {
      const ladder = data.ladder;
      setSettingsForms((prev) => ({
        ...prev,
        description: ladder?.description || "",
        location: ladder?.location || "",
        visibility: (ladder?.visibility || "public") as "public" | "private",
        rankingType: ladder?.ranking_rules?.type || "default-swap-minimal-drop",
        kFactor: ladder?.ranking_rules?.kFactor ?? 24,
        maxDrop: ladder?.ranking_rules?.maxDrop ?? 1,
        maxPositionsUp: ladder?.challenge_rules?.max_positions_up ?? 3,
        expiryDays: ladder?.challenge_rules?.expiry_days ?? 7,
        cooldownHours: ladder?.challenge_rules?.cooldown_hours ?? 0,
      }));
    }
    setIsEditingSettings(false);
    setSettingsError(null);
  };

  const ladderName = data?.ladder?.name ?? "Ladder";
  const members = data?.members ?? [];
  const organizerIds = data?.organizerIds ?? [];
  const memberCounts = data?.memberCounts ?? { active: activeMembers.length, pending: pendingMembers.length };
  const challengeCounts = data?.challengeCounts ?? { active: 0 };
  const matchCounts = data?.matchCounts ?? { confirmed: 0 };
  const hasZeroRanks = activeMembers.some((m) => !m.current_rank || m.current_rank <= 0);

  // Filter pending members by search
  const filteredPendingMembers = pendingMembers.filter((member) => {
    const name = member.users?.full_name?.toLowerCase() || "";
    const email = member.users?.email?.toLowerCase() || "";
    const search = pendingSearch.toLowerCase();
    return name.includes(search) || email.includes(search);
  });

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
    if (authLoading) return null;

    if (!user) {
      return (
        <Link
          href="/login"
          className="btn btn-secondary"
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
        className="btn btn-secondary disabled:opacity-50"
      >
        {joining ? "Joining..." : "Join ladder"}
      </button>
    );
  };



  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "My Ladders", href: "/ladders" },
          { label: ladderName }
        ]}
      />
      <PageHeader
        title={ladderName}
        description={data?.ladder?.description || "Ranking overview and membership."}
        cta={
          !isLoading && (
            <div className="flex gap-2">
              {renderJoinButton()}
            </div>
          )
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
        <div className="space-y-6">
          {/* Skeleton for tab navigation */}
          <div className="flex gap-4 border-b border-slate-200 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-24 bg-slate-200 rounded-t"></div>
            ))}
          </div>

          {/* Skeleton for dashboard content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Hero stats skeleton */}
              <div className="card p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-8 bg-slate-200 rounded"></div>
                      <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 5 skeleton */}
              <div className="card p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar skeleton */}
            <div className="lg:col-span-1">
              <div className="card p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-2/3 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="card p-6 border-l-4 border-danger-500 bg-danger-50">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-danger-900 mb-1">
                Failed to load ladder
              </h3>
              <p className="text-sm text-danger-800">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-sm font-semibold text-danger-700 hover:text-danger-900 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Tab Navigation */}
          <div className="flex gap-4 border-b border-slate-200">
            <button
              onClick={() => handleTabChange("dashboard")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${tab === "dashboard"
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
                  onClick={() => handleTabChange("ranking")}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${tab === "ranking"
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Ranking
                </button>
                <button
                  onClick={() => handleTabChange("challenges")}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${tab === "challenges"
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <Swords className="h-4 w-4" />
                  Challenges
                </button>
                <button
                  onClick={() => handleTabChange("matches")}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${tab === "matches"
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <Target className="h-4 w-4" />
                  Matches
                </button>
                {isOrganizer && (
                  <button
                    onClick={() => handleTabChange("settings")}
                    className={`px-4 py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${tab === "settings"
                      ? "border-brand-600 text-brand-700"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                )}
              </>
            )}
          </div>

          {/* Dashboard Tab */}
          {tab === "dashboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content - 2/3 width */}
              <div className="lg:col-span-2 space-y-6">
                {/* Organizer Action Banner */}
                {isOrganizer && pendingMembers.length > 0 && (
                  <OrganizerActionBanner
                    actions={[
                      {
                        id: "pending-approvals",
                        label: `${pendingMembers.length} Pending Member Approvals`,
                        count: pendingMembers.length,
                        action: () => setTab("ranking"),
                        buttonText: "Review"
                      }
                    ]}
                  />
                )}

                {/* Pending Organizer Requests for Ladder Organizers */}
                {isOrganizer && (
                  <PendingOrganizerRequests
                    ladderId={params.id}
                    onRequestProcessed={() => fetchLadder(true)}
                  />
                )}

                {/* Organizer Stats Grid */}
                {isOrganizer && (
                  <OrganizerStatsGrid
                    stats={[
                      {
                        label: "Members",
                        value: activeMembers.length,
                        subtitle: "Active",
                        icon: "users",
                        badge: pendingMembers.length > 0 ? `${pendingMembers.length} pending` : undefined,
                        action: () => setTab("ranking")
                      },
                      {
                        label: "Matches",
                        value: matchCounts.confirmed,
                        subtitle: "Confirmed",
                        icon: "target",
                        action: () => setTab("matches")
                      },
                      {
                        label: "Activity",
                        value: dashboardStats?.organizerStats?.recentMatches || 0,
                        subtitle: "This Month",
                        icon: "activity",
                        action: () => { }
                      }
                    ]}
                  />
                )}

                {/* Player Hero Stats */}
                {isMember && currentMember && (
                  <HeroStats
                    rank={currentMember.current_rank}
                    wins={dashboardStats?.myStats?.wins || 0}
                    losses={dashboardStats?.myStats?.losses || 0}
                    winStreak={dashboardStats?.myStats?.streak || 0}
                  />
                )}

                {/* Personal Activity Cards */}
                {isMember && user && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MyActiveChallengesCard userId={user.id} ladderId={params.id} />
                    <MyActiveMatchesCard userId={user.id} ladderId={params.id} />
                  </div>
                )}

                {/* Ladder-Wide Activity Cards */}
                {canAccessMembers && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <LadderChallengesCard ladderId={params.id} />
                    <LadderMatchesCard ladderId={params.id} />
                  </div>
                )}

                {/* Top 5 Rankings */}
                {isMember && (
                  <Top5Rankings
                    players={activeMembersSorted}
                    currentUserId={user?.id}
                    ladderId={params.id}
                    canChallenge={(targetRank) => {
                      const maxPositionsUp = data?.ladder?.challenge_rules?.max_positions_up ?? 3;
                      return canChallengeUtil(targetRank, currentUserRank, maxPositionsUp);
                    }}
                    onChallenge={handleQuickChallenge}
                    onViewFullRankings={() => setTab("ranking")}
                  />
                )}

                {/* Recent Activity */}
                {canAccessMembers && dashboardStats?.recentActivity && (
                  <RecentActivity
                    activities={dashboardStats.recentActivity.map((activity: any, idx: number) => ({
                      id: `activity-${idx}`,
                      type: activity.type as "match" | "challenge" | "member",
                      description: activity.description,
                      time: activity.time
                    }))}
                  />
                )}

                {/* Request to Become Organizer - Only for Players */}
                {!isOrganizer && currentMember && user?.role === "player" && (
                  <RoleRequest
                    currentRole="player"
                    hasActivRequest={hasPendingOrganizerRequest}
                    ladder_id={params.id}
                  />
                )}

                {/* Non-member view */}
                {!isMember && (
                  <div className="card p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5 text-brand-600" />
                      About this ladder
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-slate-50">
                        <p className="text-xs text-slate-500">Sport</p>
                        <p className="text-sm font-semibold text-slate-900">{formatSport(data?.ladder?.sport_id)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50">
                        <p className="text-xs text-slate-500">Location</p>
                        <p className="text-sm font-semibold text-slate-900">{data?.ladder?.location || "Not set"}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50">
                        <p className="text-xs text-slate-500">Active members</p>
                        <p className="text-lg font-semibold text-slate-900">{memberCounts.active}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50">
                        <p className="text-xs text-slate-500">Active challenges</p>
                        <p className="text-lg font-semibold text-slate-900">{challengeCounts.active}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">
                      Join to view rankings, members, and challenges. {isPending ? "Your request is awaiting approval." : ""}
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar - 1/3 width */}
              <div className="lg:col-span-1">
                <LadderInfoSidebar
                  sport={formatSport(data?.ladder?.sport_id)}
                  location={data?.ladder?.location}
                  memberCount={memberCounts.active}
                  activeChallenges={challengeCounts.active}
                  profilePictureUrl={data?.ladder?.profile_picture_url}
                  organizers={data?.organizers || []}
                />
              </div>
            </div>
          )}

          {/* Ranking Tab */}
          {tab === "ranking" && canAccessMembers && (
            <div className="space-y-6">
              {/* Pending Approvals Section for Organizers */}
              {isOrganizer && pendingMembers.length > 0 && (
                <PendingApprovals
                  members={pendingMembers}
                  onApprove={handleApproveMember}
                  onReject={handleRejectMember}
                />
              )}

              <div className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-slate-700">Ranking</p>
                    <span className="text-xs text-slate-500">{data?.ladder?.ranking_rules?.type || "Ranking"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Invitation Button - Organizers Only */}
                    {isOrganizer && (
                      <InviteMembersButton ladderId={params.id} onOpen={() => setIsInviteOpen(true)} />
                    )}

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
                      <th className="px-4 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeMembersSorted.map((member) => {
                      // Check if player has an active challenge (Pending or Accepted)
                      const isBusy = member.is_busy;
                      const isCurrentUser = member.user_id === user?.id;
                      const currentUserRank = currentMember?.current_rank || 0;
                      const targetRank = member.current_rank || 0;
                      const maxPositionsUp = data?.ladder?.challenge_rules?.max_positions_up || 3;

                      // Can only challenge if:
                      // 1. Not yourself
                      // 2. Target is ranked ABOVE you (lower rank number)
                      // 3. Within maxPositionsUp limit
                      // 4. Target is not busy (no active challenges)
                      // 5. Current user is not busy
                      const canChallenge = !isCurrentUser &&
                        currentUserRank > 0 &&
                        targetRank > 0 &&
                        targetRank < currentUserRank &&
                        (currentUserRank - targetRank) <= maxPositionsUp &&
                        !isBusy &&
                        !currentMember?.is_busy;

                      return (
                        <tr key={member.id} className="border-t border-slate-100">
                          <td className="px-4 py-2 font-semibold">#{member.current_rank ?? "-"}</td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-3">
                              <Avatar
                                name={member.users?.full_name || `${member.users?.first_name ?? ""} ${member.users?.last_name ?? ""}`}
                                email={member.users?.email}
                                src={member.users?.avatar_url}
                                size="sm"
                              />
                              <div>
                                <p className="font-medium text-slate-900">
                                  {member.users?.full_name || `${member.users?.first_name ?? ""} ${member.users?.last_name ?? ""}`.trim() || "Member"}
                                </p>
                                <div className="mt-1 flex items-center gap-2">
                                  {renderRolePill(getMemberRole(member))}
                                  {isBusy ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-800 rounded-full">
                                      <Swords className="h-3 w-3" />
                                      In Challenge
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-800 rounded-full">
                                      <CheckCircle className="h-3 w-3" />
                                      Available
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right">
                            {canChallenge ? (
                              <button
                                onClick={() => handleQuickChallenge(member.user_id)}
                                className="text-sm font-semibold text-brand-700 hover:text-brand-900"
                              >
                                Challenge
                              </button>
                            ) : (
                              !isCurrentUser && (
                                <span className="text-xs text-slate-400">
                                  {isBusy
                                    ? "Busy"
                                    : currentMember?.is_busy
                                      ? "You are busy"
                                      : targetRank >= currentUserRank
                                        ? "Can't challenge down"
                                        : "Out of range"}
                                </span>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Challenges Tab */}
          {tab === "challenges" && canAccessMembers && (
            <ChallengesTabContent ladderId={params.id} userId={user?.id} />
          )}

          {/* Matches Tab */}
          {tab === "matches" && canAccessMembers && (
            <div className="space-y-6">
              <MatchesList
                ladderId={params.id}
                currentUserId={user?.id || ""}
                isOrganizer={isOrganizer}
              />
            </div>
          )}

          {/* Settings Tab */}
          {tab === "settings" && isOrganizer && (
            <form onSubmit={handleSettingsSave} className="card space-y-6 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Ladder Settings</h2>
                <div className="flex gap-2 text-sm items-center">
                  {settingsSuccess && <span className="text-green-700 font-medium">{settingsSuccess}</span>}
                  {!isEditingSettings && !settingsSuccess && (
                    <button
                      type="button"
                      onClick={() => setIsEditingSettings(true)}
                      className="btn btn-primary btn-sm"
                    >
                      Edit
                    </button>
                  )}
                  {savingSettings && (
                    <span className="flex items-center gap-1 text-slate-600">
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving
                    </span>
                  )}
                </div>
              </div>

              {settingsError && (
                <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">{settingsError}</div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={settingsForms.description}
                    onChange={handleSettingsChange}
                    rows={3}
                    disabled={!isEditingSettings}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="location">
                    Location
                  </label>
                  <input
                    id="location"
                    name="location"
                    value={settingsForms.location}
                    onChange={handleSettingsChange}
                    disabled={!isEditingSettings}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="visibility">
                    Visibility
                  </label>
                  <select
                    id="visibility"
                    name="visibility"
                    value={settingsForms.visibility}
                    onChange={handleSettingsChange}
                    disabled={!isEditingSettings}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-base font-semibold text-slate-900 mb-3">Ranking Rules</h3>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">Ranking System</label>
                  <div className="grid gap-2 md:grid-cols-2">
                    {[
                      { id: "swap-positions", label: "Swap Positions" },
                      { id: "default-swap-minimal-drop", label: "Default Swap (Minimal Drop)" },
                      { id: "slide-shift", label: "Slide Shift" },
                      { id: "points-elo", label: "Points/ELO" },
                    ].map((type) => (
                      <label key={type.id} className={`flex items-center gap-3 rounded-lg border border-slate-200 p-3 ${isEditingSettings ? "hover:bg-slate-50 cursor-pointer" : "bg-slate-50 cursor-not-allowed"}`}>
                        <input
                          type="radio"
                          name="rankingType"
                          value={type.id}
                          checked={settingsForms.rankingType === type.id}
                          onChange={handleSettingsChange}
                          disabled={!isEditingSettings}
                        />
                        <span className="text-sm font-medium text-slate-900">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="kFactor">
                      K-Factor
                    </label>
                    <input
                      type="number"
                      id="kFactor"
                      name="kFactor"
                      value={settingsForms.kFactor}
                      onChange={handleSettingsChange}
                      min="1"
                      disabled={!isEditingSettings}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="maxDrop">
                      Max Drop
                    </label>
                    <input
                      type="number"
                      id="maxDrop"
                      name="maxDrop"
                      value={settingsForms.maxDrop}
                      onChange={handleSettingsChange}
                      min="0"
                      disabled={!isEditingSettings}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-base font-semibold text-slate-900 mb-3">Challenge Rules</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="maxPositionsUp">
                      Max Positions Up
                    </label>
                    <input
                      type="number"
                      id="maxPositionsUp"
                      name="maxPositionsUp"
                      value={settingsForms.maxPositionsUp}
                      onChange={handleSettingsChange}
                      min="0"
                      disabled={!isEditingSettings}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="expiryDays">
                      Expiry Days
                    </label>
                    <input
                      type="number"
                      id="expiryDays"
                      name="expiryDays"
                      value={settingsForms.expiryDays}
                      onChange={handleSettingsChange}
                      min="0"
                      disabled={!isEditingSettings}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="cooldownHours">
                      Cooldown Hours
                    </label>
                    <input
                      type="number"
                      id="cooldownHours"
                      name="cooldownHours"
                      value={settingsForms.cooldownHours}
                      onChange={handleSettingsChange}
                      min="0"
                      disabled={!isEditingSettings}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                {isEditingSettings ? (
                  <>
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="btn btn-primary flex items-center gap-2 disabled:opacity-60"
                    >
                      {savingSettings ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelSettings}
                      disabled={savingSettings}
                      className="btn border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </>
                ) : null}
              </div>
            </form>
          )}
        </>
      )}


      {/* Invitation Modal */}
      {isInviteOpen && (
        <InviteMembersModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          ladderId={params.id}
          ladderName={data?.ladder?.name || "Ladder"}
        />
      )}
    </div>
  );
}
