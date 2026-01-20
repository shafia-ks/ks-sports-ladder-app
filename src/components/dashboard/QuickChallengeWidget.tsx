"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";
import { usePendingActions } from "@/hooks/usePendingActions";
import { Zap, ArrowUpCircle, Swords, Lock } from "lucide-react";

export interface SmartTarget {
    opponent_id: string;
    opponent_name: string;
    opponent_avatar_url: string | null;
    ladder_id: string;
    ladder_name: string;
    opponent_rank: number;
    rank_diff: number;
}

export function QuickChallengeWidget() {
    const { user } = useAuth();
    const { push: toast } = useToast();
    const { data: actions } = usePendingActions();

    const [targets, setTargets] = useState<SmartTarget[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTarget, setSelectedTarget] = useState<SmartTarget | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const supabase = createClient();

    // Check if user is busy in a specific ladder
    const isBusyInLadder = (ladderId: string) => {
        return actions?.some(a =>
            a.ladder_id === ladderId &&
            ['challenge', 'submit_score', 'confirm_score'].includes(a.type)
        );
    };

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
                    maxPositionsUp: ladderDetails.challenge_rules?.max_positions_up || 3,
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
            <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-amber-500 fill-amber-500" /> Climb the Ladder
                        </h2>
                        <p className="text-sm text-slate-500">Available opponents within your reach</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {Object.entries(groupedTargets).map(([ladderName, ladderTargets]) => {
                        const ladderId = ladderTargets[0]?.ladder_id;
                        const isLadderBusy = isBusyInLadder(ladderId);

                        return (
                            <div key={ladderName} className="relative">
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                                        {ladderName}
                                    </h3>
                                    {isLadderBusy && (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 shadow-sm">
                                            <Lock className="h-3 w-3 text-amber-600" />
                                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">Pending Activity</span>
                                        </div>
                                    )}
                                </div>

                                <div className={`space-y-3 ${isLadderBusy ? 'opacity-70 saturate-50' : ''}`}>
                                    {ladderTargets.map((target) => (
                                        <div key={`${target.ladder_id}-${target.opponent_id}`}
                                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-100 transition-all group
                                                ${!isLadderBusy ? 'hover:border-brand-300' : ''}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <Avatar
                                                    src={target.opponent_avatar_url}
                                                    name={target.opponent_name}
                                                    size="lg"
                                                />
                                                <div>
                                                    <h3 className="font-semibold text-slate-900">{target.opponent_name}</h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-bold uppercase py-0.5 px-1.5 bg-slate-100 text-slate-600 rounded">Rank #{target.opponent_rank}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-5">
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Strategy</p>
                                                    <p className="text-sm font-bold text-green-600 flex items-center gap-1">
                                                        <ArrowUpCircle className="h-3 w-3" /> {target.rank_diff} {target.rank_diff === 1 ? 'spot' : 'spots'} up
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => !isLadderBusy && setSelectedTarget(target)}
                                                    disabled={!!isLadderBusy}
                                                    title={isLadderBusy ? "Resolve pending actions in this ladder first" : "Send Challenge"}
                                                    className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-bold transition-colors gap-2 shadow-sm
                                                        ${isLadderBusy
                                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                                            : 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-200 cursor-pointer'
                                                        }`}
                                                >
                                                    {isLadderBusy ? <Lock className="h-4 w-4" /> : <Swords className="h-4 w-4" />}
                                                    {isLadderBusy ? 'Locked' : 'Challenge'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
