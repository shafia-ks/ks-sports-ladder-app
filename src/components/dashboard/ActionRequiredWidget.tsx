"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { CheckCircle, Clock, Swords, Trophy } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { usePendingActions, PendingAction } from "@/hooks/usePendingActions";
import { useQueryClient } from "@tanstack/react-query";
import { useRespondToChallenge } from "@/features/challenges/api";
import { useConfirmMatch, useSubmitScore, useCancelMatch } from "@/features/matches/api";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { ScoreSubmitModal } from "@/components/matches/ScoreSubmitModal";
import { Avatar } from "@/components/ui/avatar";

export function ActionRequiredWidget() {
    const { user } = useAuth();
    const { data: actions = [], isLoading: loadingActions } = usePendingActions();
    const queryClient = useQueryClient();
    const supabase = createClient();
    const { push: toast } = useToast();

    // Mutations
    const { mutate: respondToChallenge, isPending: isResponding } = useRespondToChallenge();
    const { mutate: confirmMatch, isPending: isConfirming } = useConfirmMatch();
    const { mutate: submitScore, isPending: isSubmitting } = useSubmitScore();
    const { mutate: cancelMatch, isPending: isCancelling } = useCancelMatch();

    // State for interactive modals
    const [disputeModalOpen, setDisputeModalOpen] = useState(false);
    const [scoreModalOpen, setScoreModalOpen] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState<PendingAction | null>(null);
    const [disputeReason, setDisputeReason] = useState("");

    // State to track which item is loading (for inline buttons)
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        // Event-Driven: Subscribe to Realtime changes
        const channel = supabase
            .channel('action-required-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges', filter: `challenged_id=eq.${user.id}` },
                () => queryClient.invalidateQueries({ queryKey: ["pendingActions_v2", user.id] }))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `player1_id=eq.${user.id}` },
                () => queryClient.invalidateQueries({ queryKey: ["pendingActions_v2", user.id] }))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `player2_id=eq.${user.id}` },
                () => queryClient.invalidateQueries({ queryKey: ["pendingActions_v2", user.id] }))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ladder_memberships' },
                () => queryClient.invalidateQueries({ queryKey: ["pendingActions_v2", user.id] }))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leader_requests' },
                () => queryClient.invalidateQueries({ queryKey: ["pendingActions_v2", user.id] }))
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, queryClient]);

    const handleConfirmCancel = () => {
        if (!selectedAction?.match_id) return;

        cancelMatch({ matchId: selectedAction.match_id, reason: "Mutual Cancellation (No Winner)" }, {
            onSuccess: () => {
                setCancelModalOpen(false);
                setSelectedAction(null);
            }
        });
    }

    const openCancelModal = (action: PendingAction) => {
        setSelectedAction(action);
        setCancelModalOpen(true);
    }

    const handleChallengeResponse = (id: string, status: "Accepted" | "Declined") => {
        setProcessingId(id);
        respondToChallenge({ id, status }, {
            onSuccess: () => {
                toast({ title: `Challenge ${status}`, variant: "success" });
                setProcessingId(null);
            },
            onError: (err) => {
                toast({ title: "Error", description: err.message, variant: "error" });
                setProcessingId(null);
            }
        });
    };

    const handleConfirmMatch = (matchId: string, action: "confirm" | "dispute") => {
        if (action === "dispute") {
            const actionItem = actions.find(a => a.match_id === matchId);
            if (actionItem) {
                setSelectedAction(actionItem);
                setDisputeReason("");
                setDisputeModalOpen(true);
            }
            return;
        }

        setProcessingId(matchId);
        confirmMatch({ id: matchId, userId: user!.id, action: "confirm" }, {
            onSuccess: () => {
                toast({ title: "Match Confirmed", variant: "success" });
                setProcessingId(null);
            },
            onError: (err) => {
                toast({ title: "Error", description: err.message, variant: "error" });
                setProcessingId(null);
            }
        });
    };

    const handleSubmitDispute = () => {
        if (!selectedAction?.match_id || !disputeReason.trim()) return;

        confirmMatch({ id: selectedAction.match_id, userId: user!.id, action: "dispute", reason: disputeReason }, {
            onSuccess: () => {
                toast({ title: "Dispute Submitted", variant: "default" });
                setDisputeModalOpen(false);
                setSelectedAction(null);
            },
            onError: (err) => {
                toast({ title: "Error", description: err.message, variant: "error" });
            }
        });
    };

    const openScoreModal = (action: PendingAction) => {
        setSelectedAction(action);
        setScoreModalOpen(true);
    };

    const handleScoreSubmit = (data: { setScores: string[], winnerId: string }) => {
        if (!selectedAction?.match_id) return;

        submitScore({
            id: selectedAction.match_id,
            userId: user!.id,
            setScores: data.setScores,
            winnerId: data.winnerId,
            playedAt: new Date().toISOString()
        }, {
            onSuccess: () => {
                toast({ title: "Score Submitted", variant: "success" });
                setScoreModalOpen(false);
                setSelectedAction(null);
            },
            onError: (err) => {
                toast({ title: "Error", description: err.message, variant: "error" });
            }
        });
    };

    if (loadingActions) {
        return null;
    }

    if (actions.length === 0) {
        return null; // Don't show anything when there are no actions
    }

    // Group actions by type
    const challengeActions = actions.filter(a => a.type === "challenge");
    const confirmScoreActions = actions.filter(a => a.type === "confirm_score");
    const submitScoreActions = actions.filter(a => a.type === "submit_score");
    const memberApprovalActions = actions.filter(a => a.type === "approve_member");
    const organizerApprovalActions = actions.filter(a => a.type === "approve_organizer");

    return (
        <div className="space-y-4">


            {/* Pending Challenges */}
            {challengeActions.length > 0 && (
                <div className="card p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <Swords className="h-4 w-4" />
                        Pending Challenges ({challengeActions.length})
                    </h3>
                    <div className="space-y-2">
                        {challengeActions.map((action) => {
                            const isProcessing = processingId === action.id;
                            const expiresAt = action.expires_at ? new Date(action.expires_at) : null;
                            const hoursRemaining = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))) : null;

                            return (
                                <div key={action.id} className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 flex-1">
                                            <Avatar name={action.opponent_name || "?"} size="sm" />
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900">{action.opponent_name}</p>
                                                <p className="text-xs text-slate-600">{action.ladder_name}</p>
                                                {hoursRemaining !== null && (
                                                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        Expires in {hoursRemaining}h
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <button
                                                onClick={() => handleChallengeResponse(action.id, "Accepted")}
                                                disabled={!!processingId}
                                                className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex-1 sm:flex-none disabled:opacity-50"
                                            >
                                                {isProcessing ? "..." : <>✓ Accept</>}
                                            </button>
                                            <button
                                                onClick={() => handleChallengeResponse(action.id, "Declined")}
                                                disabled={!!processingId}
                                                className="btn btn-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex-1 sm:flex-none disabled:opacity-50"
                                            >
                                                ✕ Decline
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Confirm Scores */}
            {confirmScoreActions.length > 0 && (
                <div className="card p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Confirm Scores ({confirmScoreActions.length})
                    </h3>
                    <div className="space-y-2">
                        {confirmScoreActions.map((action) => {
                            const isProcessing = processingId === action.match_id;

                            return (
                                <div key={action.id} className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 flex-1">
                                            <Avatar name={action.opponent_name || "?"} size="sm" />
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900">vs {action.opponent_name}</p>
                                                <p className="text-xs text-slate-600">{action.ladder_name}</p>
                                                <p className="text-xs text-green-700 mt-1">Score submitted - awaiting your confirmation</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <button
                                                onClick={() => handleConfirmMatch(action.match_id!, "confirm")}
                                                disabled={!!processingId}
                                                className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex-1 sm:flex-none disabled:opacity-50"
                                            >
                                                {isProcessing ? "..." : "✓ Confirm"}
                                            </button>
                                            <button
                                                onClick={() => handleConfirmMatch(action.match_id!, "dispute")}
                                                disabled={!!processingId}
                                                className="btn btn-sm bg-orange-600 text-white hover:bg-orange-700 flex-1 sm:flex-none disabled:opacity-50"
                                            >
                                                ⚠ Dispute
                                            </button>
                                            <button
                                                onClick={() => openCancelModal(action)}
                                                disabled={!!processingId}
                                                title="Void/Cancel Match (No Winner)"
                                                className="btn btn-sm bg-white border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Submit Scores */}
            {submitScoreActions.length > 0 && (
                <div className="card p-4 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
                    <h3 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Submit Match Scores ({submitScoreActions.length})
                    </h3>
                    <div className="space-y-2">
                        {submitScoreActions.map((action) => {
                            const isProcessing = processingId === action.match_id;

                            return (
                                <div key={action.id} className="bg-white rounded-lg p-3 border border-amber-200 shadow-sm">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 flex-1">
                                            <Avatar name={action.opponent_name || "?"} size="sm" />
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900">vs {action.opponent_name}</p>
                                                <p className="text-xs text-slate-600">{action.ladder_name}</p>
                                                <p className="text-xs text-amber-700 mt-1">Match completed? Submit the score!</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <button
                                                onClick={() => openScoreModal(action)}
                                                disabled={!!processingId}
                                                className="btn btn-sm bg-brand-600 text-white hover:bg-brand-700 flex-1 sm:flex-none disabled:opacity-50"
                                            >
                                                🏆 Enter Score
                                            </button>
                                            <button
                                                onClick={() => openCancelModal(action)}
                                                disabled={!!processingId}
                                                title="Void/Cancel Match (No Winner)"
                                                className="btn btn-sm bg-white border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Member Approvals */}
            {memberApprovalActions.length > 0 && (
                <div className="card p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                    <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Pending Member Approvals ({memberApprovalActions.length})
                    </h3>
                    <div className="space-y-2">
                        {memberApprovalActions.slice(0, 3).map((action) => (
                            <div key={action.id} className="bg-white rounded-lg p-3 border border-purple-200 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1">
                                        <Avatar name={action.requester_name || "?"} size="sm" />
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">{action.requester_name}</p>
                                            <p className="text-xs text-slate-600">{action.ladder_name}</p>
                                            {action.requested_at && (
                                                <p className="text-xs text-purple-700 mt-1">
                                                    Requested {new Date(action.requested_at).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <Link
                                        href={`/ladders/${action.ladder_id}?tab=dashboard`}
                                        className="btn btn-sm bg-brand-600 text-white hover:bg-brand-700 w-full sm:w-auto"
                                    >
                                        Review →
                                    </Link>
                                </div>
                            </div>
                        ))}
                        {memberApprovalActions.length > 3 && (
                            <p className="text-xs text-center text-purple-700 pt-2">
                                + {memberApprovalActions.length - 3} more...
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Organizer Approvals */}
            {organizerApprovalActions.length > 0 && (
                <div className="card p-4 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
                    <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Pending Organizer Requests ({organizerApprovalActions.length})
                    </h3>
                    <div className="space-y-2">
                        {organizerApprovalActions.map((action) => (
                            <div key={action.id} className="bg-white rounded-lg p-3 border border-red-200 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1">
                                        <Avatar name={action.requester_name || "?"} size="sm" />
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">{action.requester_name}</p>
                                            <p className="text-xs text-slate-600">{action.ladder_name}</p>
                                            {action.requested_at && (
                                                <p className="text-xs text-red-700 mt-1">
                                                    Requested {new Date(action.requested_at).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <Link
                                        href={`/ladders/${action.ladder_id}?tab=dashboard`}
                                        className="btn btn-sm bg-brand-600 text-white hover:bg-brand-700 w-full sm:w-auto"
                                    >
                                        Review →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modals */}
            <ConfirmModal
                isOpen={disputeModalOpen}
                onClose={() => setDisputeModalOpen(false)}
                onConfirm={handleSubmitDispute}
                title="Dispute Match"
                message={
                    <div className="space-y-3">
                        <p className="text-sm text-slate-600">
                            Please provide a reason for disputing this match.
                        </p>
                        <textarea
                            className="w-full h-24 p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                            placeholder="Reason for dispute..."
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                        />
                    </div>
                }
                confirmText={isConfirming ? "Submitting..." : "Submit Dispute"}
                confirmDisabled={!disputeReason.trim() || isConfirming}
                loading={isConfirming}
                variant="danger"
            />

            <ConfirmModal
                isOpen={cancelModalOpen}
                onClose={() => setCancelModalOpen(false)}
                onConfirm={handleConfirmCancel}
                title="Void Match?"
                message="Are you sure you want to cancel this match with NO WINNER? This is usually done for mutual forfeits or invalid games. This action cannot be undone."
                confirmText={isCancelling ? "Voiding..." : "Yes, Void Match"}
                loading={isCancelling}
                variant="danger"
            />

            {selectedAction && (
                <ScoreSubmitModal
                    isOpen={scoreModalOpen}
                    onClose={() => setScoreModalOpen(false)}
                    onSubmit={handleScoreSubmit}
                    player1Name={(user as any)?.user_metadata?.full_name || user?.email || "You"}
                    player2Name={selectedAction.opponent_name || "Opponent"}
                    player1Id={user!.id}
                    player2Id={selectedAction.opponent_id || "unknown"}
                    loading={isSubmitting}
                />
            )}
        </div>
    );
}
