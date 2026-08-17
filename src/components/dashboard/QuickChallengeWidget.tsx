"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { Zap, ArrowUpCircle, Swords, Lock, Loader2 } from "lucide-react";

export interface SmartTarget {
    opponent_id: string;
    opponent_name: string;
    opponent_avatar_url: string | null;
    ladder_id: string;
    ladder_name: string;
    opponent_rank: number;
    rank_diff: number;
    is_user_busy: boolean; // New field from RPC
}

export function QuickChallengeWidget() {
    const { user } = useAuth();
    const { push: toast } = useToast();
    const queryClient = useQueryClient();

    // We strictly rely on the RPC to tell us if we are busy in a specific ladder
    // This handles "Playing", "Pending Challenge", etc. accurately per database rules.
    const [targets, setTargets] = useState<SmartTarget[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTarget, setSelectedTarget] = useState<SmartTarget | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const supabase = createClient();

    const fetchTargets = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await (supabase.rpc as any)("get_smart_targets", { p_user_id: user!.id });
            if (error) {
                console.error("Error fetching smart targets:", error);
            } else if (data) {
                setTargets(data);
            }
        } catch (err) {
            console.error("Failed to fetch smart targets", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTargets();
    }, [user]);

    const handleChallengeChange = async () => {
        if (!user || !selectedTarget) return;
        setIsConfirming(true);

        try {
            // 1. Fetch ladder rules
            const ladderRes = await fetch(`/api/ladders/${selectedTarget.ladder_id}`);
            if (!ladderRes.ok) throw new Error("Failed to load ladder details");
            const ladderData = await ladderRes.json();
            const ladderDetails = ladderData.ladder;

            // 2. Prepare payload
            const myRank = selectedTarget.opponent_rank + selectedTarget.rank_diff;

            const payload = {
                ladderId: selectedTarget.ladder_id,
                challengerId: user.id,
                challengedId: selectedTarget.opponent_id,
                challengerRank: myRank,
                challengedRank: selectedTarget.opponent_rank,
                challengerActiveChallenges: 0,
                challengedActiveChallenges: 0,
                challengerBusy: false,
                challengedBusy: false,
                rules: {
                    maxPositionsUp: ladderDetails.challenge_rules?.max_positions_up ?? null,
                    preventChallengingBusyPlayers: true,
                    maxActiveChallengesPerPlayer: ladderDetails.challenge_rules?.max_active_challenges_per_player || 3,
                    expiryDays: ladderDetails.challenge_rules?.expiry_days || 7,
                    cooldownHours: ladderDetails.challenge_rules?.cooldown_hours || 0,
                },
            };

            // 3. Send Challenge
            const res = await fetch("/api/challenges", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error || json.errors?.[0]?.message || "Failed to create challenge");
            }

            toast({
                title: "Challenge Sent!",
                description: `You have challenged ${selectedTarget.opponent_name}.`,
                variant: "success",
            });

            // Invalidate all related queries to update UI immediately
            queryClient.invalidateQueries({ queryKey: ["challenges"] });
            queryClient.invalidateQueries({ queryKey: ["pendingActions"] });
            queryClient.invalidateQueries({ queryKey: ["smart-targets"] });
            queryClient.invalidateQueries({ queryKey: ["ladder"] });

            setSelectedTarget(null);
            fetchTargets(); // Refresh list
        } catch (err: any) {
            console.error(err);
            toast({
                title: "Failed to send challenge",
                description: err.message || "Unknown error occurred.",
                variant: "error",
            });
        } finally {
            setIsConfirming(false);
        }
    };

    // Group targets by ladder name
    const groupedTargets = targets.reduce((acc, target) => {
        if (!acc[target.ladder_name]) {
            acc[target.ladder_name] = [];
        }
        acc[target.ladder_name].push(target);
        return acc;
    }, {} as Record<string, SmartTarget[]>);

    if (!loading && targets.length === 0) {
        return (
            <div className="card overflow-hidden border-slate-200 bg-white shadow-sm p-6">
                <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-slate-400" />
                    <h2 className="text-lg font-bold text-slate-900">Climb the Ladder</h2>
                </div>
                <p className="text-sm text-slate-500">No available opponents to challenge right now. Check back later!</p>
            </div>
        );
    }

    if (loading) {
        return <div className="card p-6 h-48 animate-pulse bg-slate-50" />;
    }

    return (
        <div className="card overflow-hidden border-brand-100 bg-gradient-to-br from-white to-brand-50/20 shadow-sm transition-all hover:shadow-md relative">
            <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Climb the Ladder
                        </h2>
                        <p className="text-[10px] text-slate-500">Available opponents within your reach</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {Object.entries(groupedTargets).map(([ladderName, ladderTargets]) => {
                        // The user is busy in this ladder if ANY target in this group says so (they all should agree)
                        const isLadderBusy = ladderTargets[0]?.is_user_busy;

                        return (
                            <div key={ladderName} className="relative">
                                <div className="flex items-center justify-between mb-1 px-0.5">
                                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                        {ladderName}
                                    </h3>
                                </div>

                                {isLadderBusy ? (
                                    <div className="px-3 py-2 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-1.5 text-xs">
                                        <Lock className="h-3 w-3 text-amber-600 flex-shrink-0" />
                                        <span className="text-amber-900 font-medium">Active challenge - complete to unlock</span>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        {ladderTargets.map((target) => (
                                            <div key={`${target.ladder_id}-${target.opponent_id}`}
                                                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-100 hover:border-brand-300 transition-all group">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <Avatar
                                                        src={target.opponent_avatar_url}
                                                        name={target.opponent_name}
                                                        size="xs"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-xs font-semibold text-slate-900 truncate">{target.opponent_name}</h3>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <span className="text-[8px] font-bold uppercase py-0.5 px-1 bg-slate-100 text-slate-600 rounded">Rank #{target.opponent_rank}</span>
                                                            <span className="text-[8px] font-medium text-green-600 flex items-center gap-0.5">
                                                                <ArrowUpCircle className="h-2 w-2" /> +{target.rank_diff}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setSelectedTarget(target)}
                                                    disabled={isConfirming}
                                                    className="inline-flex items-center justify-center rounded-full bg-brand-600 p-1.5 text-white hover:bg-brand-700 transition-colors shadow-sm cursor-pointer flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Challenge"
                                                    aria-label="Challenge"
                                                >
                                                    {isConfirming && selectedTarget?.opponent_id === target.opponent_id ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Swords className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <ConfirmModal
                isOpen={!!selectedTarget}
                onClose={() => setSelectedTarget(null)}
                onConfirm={handleChallengeChange}
                title="Confirm Challenge"
                message={
                    selectedTarget ? (
                        <div className="flex items-center justify-center p-4">
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <Avatar src={user?.avatarUrl} name={user?.firstName || "Me"} size="lg" />
                                    <p className="text-xs font-semibold mt-1 text-slate-700">You</p>
                                </div>
                                <div className="text-brand-300 font-bold text-lg">VS</div>
                                <div className="text-center">
                                    <Avatar src={selectedTarget.opponent_avatar_url} name={selectedTarget.opponent_name} size="lg" />
                                    <p className="text-xs font-semibold mt-1 text-slate-700">#{selectedTarget.opponent_rank}</p>
                                </div>
                            </div>
                            <div className="mt-4 text-center text-sm text-slate-600">
                                Challenge <strong>{selectedTarget.opponent_name}</strong> in {selectedTarget.ladder_name}?
                            </div>
                        </div>
                    ) : ""
                }
                confirmText="Send Challenge"
                variant="primary"
                loading={isConfirming}
            />
        </div>
    );
}
