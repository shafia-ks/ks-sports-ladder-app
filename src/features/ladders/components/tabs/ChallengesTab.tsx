"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Clock, Swords, Calendar, MapPin, MessageSquare, X, Activity, CheckCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAnalytics } from "@/lib/analytics/tracker";

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

interface ChallengesTabProps {
    ladderId: string;
    userId?: string;
}

export function ChallengesTab({ ladderId, userId }: ChallengesTabProps) {
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

    // Separate Pending challenges from Accepted (which are now matches)
    const pendingChallenges = challenges.filter(c => c.status === "Pending");
    const scheduledMatches = challenges.filter(c => c.status === "Accepted");
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
            {/* Pending Challenges (Awaiting Response) */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Swords className="h-5 w-5 text-brand-600" />
                        Pending Challenges ({pendingChallenges.length})
                    </h3>

                </div>

                {pendingChallenges.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">No pending challenges</p>
                ) : (
                    <div className="space-y-3">
                        {pendingChallenges.map((challenge) => {
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

                                                {challenge.status === "Accepted" && (
                                                    <div className="mt-2 text-sm text-green-600 font-medium flex items-center gap-1">
                                                        <CheckCircle className="h-4 w-4" />
                                                        Match Scheduled - check 'Matches' tab
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!isChallenger && challenge.status === "Pending" && (
                                                <>

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

            {/* Scheduled Matches (Accepted Challenges) */}
            {scheduledMatches.length > 0 && (
                <div className="card p-6 bg-green-50 border-2 border-green-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Scheduled Matches ({scheduledMatches.length})
                        </h3>
                        <Link
                            href={`/ladders/${ladderId}?tab=matches`}
                            className="text-sm text-green-700 hover:text-green-900 font-medium"
                        >
                            View in Matches →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {scheduledMatches.map((challenge) => {
                            const isChallenger = challenge.challenger_id === userId;
                            const opponent = isChallenger ? challenge.challenged : challenge.challenger;

                            return (
                                <div key={challenge.id} className="border border-green-300 bg-white rounded-lg p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 flex-1">
                                            <Avatar
                                                name={opponent?.full_name || opponent?.email || "?"}
                                                email={opponent?.email}
                                                size="md"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900">
                                                    vs {opponent?.full_name || opponent?.email}
                                                </p>
                                                <p className="text-sm text-green-700 font-medium mt-1 flex items-center gap-1">
                                                    <CheckCircle className="h-4 w-4" />
                                                    Match created - ready to play
                                                </p>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/ladders/${ladderId}?tab=matches`}
                                            className="btn btn-sm bg-green-600 text-white hover:bg-green-700"
                                        >
                                            Submit Score
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

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
