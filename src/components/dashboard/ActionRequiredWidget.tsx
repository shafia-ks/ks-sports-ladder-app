"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { AlertCircle, CheckCircle, Clock, Swords, Check, X, Trophy } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { usePendingActions, PendingAction } from "@/hooks/usePendingActions";
import { useQueryClient } from "@tanstack/react-query";
import { useRespondToChallenge } from "@/features/challenges/api";
import { useConfirmMatch, useSubmitScore } from "@/features/matches/api";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { ScoreSubmitModal } from "@/components/matches/ScoreSubmitModal";

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

    // State for interactive modals
    const [disputeModalOpen, setDisputeModalOpen] = useState(false);
    const [scoreModalOpen, setScoreModalOpen] = useState(false);
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
                () => queryClient.invalidateQueries({ queryKey: ["pendingActions", user.id] }))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `player1_id=eq.${user.id}` },
                () => queryClient.invalidateQueries({ queryKey: ["pendingActions", user.id] }))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `player2_id=eq.${user.id}` },
                () => queryClient.invalidateQueries({ queryKey: ["pendingActions", user.id] }))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ladder_memberships' },
                () => queryClient.invalidateQueries({ queryKey: ["pendingActions", user.id] }))
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, queryClient]);

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

    const getActionIcon = (type: string) => {
        switch (type) {
            case "challenge": return <Swords className="h-5 w-5" />;
            case "confirm_score": return <CheckCircle className="h-5 w-5" />;
            case "submit_score": return <Trophy className="h-5 w-5" />;
            case "approve_member":
            case "approve_organizer": return <Clock className="h-5 w-5" />;
            default: return <Clock className="h-5 w-5" />;
        }
    };

    const getActionTitle = (action: PendingAction) => {
        switch (action.type) {
            case "challenge": return `Challenge from ${action.opponent_name}`;
            case "confirm_score": return `Confirm score vs ${action.opponent_name}`;
            case "submit_score": return `Submit score vs ${action.opponent_name}`;
            case "approve_member": return `Approve ${action.requester_name}`;
            case "approve_organizer": return `Approve Organizer ${action.requester_name}`;
            default: return "Action Required";
        }
    };

    if (loadingActions) {
        return (
            <div className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                    <h2 className="text-lg font-semibold text-slate-900">Action Required</h2>
                </div>
                <div className="space-y-3">
                    {[1, 2].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)}
                </div>
            </div>
        );
    }

    if (actions.length === 0) {
        return (
            <div className="card p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                        <h2 className="text-lg font-semibold text-green-900">All Caught Up!</h2>
                        <p className="text-sm text-green-700">No pending actions at the moment.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                    <h2 className="text-lg font-semibold text-slate-900">
                        Action Required ({actions.length})
                    </h2>
                </div>
            </div>

            <div className="space-y-3">
                {actions.map((action) => {
                    const isProcessing = processingId === (action.id || action.match_id);

                    return (
                        <div key={action.id} className="bg-white rounded-lg p-4 border border-amber-200 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                        {getActionIcon(action.type)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{getActionTitle(action)}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-slate-600">{action.ladder_name}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Interactive Buttons */}
                                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                    {action.type === "challenge" && (
                                        <>
                                            <button
                                                onClick={() => handleChallengeResponse(action.id, "Accepted")}
                                                disabled={!!processingId}
                                                className="btn btn-sm bg-brand-600 text-white hover:bg-brand-700 flex-1 sm:flex-none justify-center disabled:opacity-50"
                                            >
                                                {isProcessing ? "..." : <><Check className="h-4 w-4 mr-1" /> Accept</>}
                                            </button>
                                            <button
                                                onClick={() => handleChallengeResponse(action.id, "Declined")}
                                                disabled={!!processingId}
                                                className="btn btn-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex-1 sm:flex-none justify-center disabled:opacity-50"
                                            >
                                                <X className="h-4 w-4 mr-1" /> Decline
                                            </button>
                                        </>
                                    )}

                                    {action.type === "confirm_score" && action.match_id && (
                                        <>
                                            <button
                                                onClick={() => handleConfirmMatch(action.match_id!, "confirm")}
                                                disabled={!!processingId}
                                                className="btn btn-sm bg-brand-600 text-white hover:bg-brand-700 flex-1 sm:flex-none justify-center disabled:opacity-50"
                                            >
                                                {isProcessing ? "..." : "Confirm"}
                                            </button>
                                            <button
                                                onClick={() => handleConfirmMatch(action.match_id!, "dispute")}
                                                disabled={!!processingId}
                                                className="btn btn-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex-1 sm:flex-none justify-center disabled:opacity-50"
                                            >
                                                Dispute
                                            </button>
                                        </>
                                    )}

                                    {action.type === "submit_score" && (
                                        <button
                                            onClick={() => openScoreModal(action)}
                                            disabled={!!processingId}
                                            className="btn btn-sm bg-brand-600 text-white hover:bg-brand-700 w-full sm:w-auto justify-center disabled:opacity-50"
                                        >
                                            Enter Score
                                        </button>
                                    )}

                                    {/* Fallback for other types (Organizer approvals) -> Link */}
                                    {(action.type === "approve_member" || action.type === "approve_organizer") && (
                                        <Link
                                            href={`/ladders/${action.ladder_id}?tab=dashboard`}
                                            className="btn btn-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 w-full sm:w-auto justify-center"
                                        >
                                            View Request
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

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
