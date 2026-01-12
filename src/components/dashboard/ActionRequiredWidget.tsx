"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { AlertCircle, CheckCircle, Clock, Swords } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface PendingAction {
    id: string;
    type: "challenge" | "confirm_score" | "submit_score" | "approve_member" | "approve_organizer";
    ladder_id: string;
    ladder_name: string;
    opponent_name?: string;
    requester_name?: string;
    expires_at?: string;
    requested_at?: string;
    status?: string;
    match_id?: string;
}

export function ActionRequiredWidget() {
    const { user } = useAuth();
    const [actions, setActions] = useState<PendingAction[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    // Function to fetch actions (reused for initial load and updates)
    const fetchPendingActions = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/dashboard/pending-actions?user_id=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setActions(data.actions || []);
            }
        } catch (error) {
            console.error("Failed to fetch pending actions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;

        fetchPendingActions();

        // Event-Driven: Subscribe to Realtime changes
        const channel = supabase
            .channel('action-required-changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen for INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'challenges',
                    filter: `challenged_id=eq.${user.id}`, // Only my challenges
                },
                () => {
                    console.log('Realtime update: challenges changed');
                    fetchPendingActions();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'matches',
                    // We can't filter complex OR conditions in realtime easily, so we listen to all and re-fetch.
                    // Optimization: Ideally filter by user partcipation if RLS allows, but RLS should filter visible rows anyway.
                    // For matches, we listen for changes where I am involved.
                    filter: `player1_id=eq.${user.id}`,
                },
                () => {
                    console.log('Realtime update: matches changed (player1)');
                    fetchPendingActions();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'matches',
                    filter: `player2_id=eq.${user.id}`,
                },
                () => {
                    console.log('Realtime update: matches changed (player2)');
                    fetchPendingActions();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const getActionIcon = (type: string) => {
        switch (type) {
            case "challenge":
                return <Swords className="h-5 w-5" />;
            case "confirm_score":
                return <CheckCircle className="h-5 w-5" />;
            case "submit_score":
                return <AlertCircle className="h-5 w-5" />;
            case "approve_member":
            case "approve_organizer":
                return <Clock className="h-5 w-5" />;
            default:
                return <Clock className="h-5 w-5" />;
        }
    };

    const getActionText = (action: PendingAction) => {
        switch (action.type) {
            case "challenge":
                return `Respond to challenge from ${action.opponent_name}`;
            case "confirm_score":
                return `Confirm score vs ${action.opponent_name}`;
            case "submit_score":
                return `Submit score for match vs ${action.opponent_name}`;
            case "approve_member":
                return `Approve ${action.requester_name} to join`;
            case "approve_organizer":
                return `Approve ${action.requester_name} as organizer`;
            default:
                return "Action required";
        }
    };

    const getActionLink = (action: PendingAction) => {
        if (action.type === "challenge") {
            return `/ladders/${action.ladder_id}?tab=challenges`;
        }
        if (action.type === "approve_member" || action.type === "approve_organizer") {
            return `/ladders/${action.ladder_id}?tab=dashboard`;
        }
        return `/ladders/${action.ladder_id}?tab=matches`;
    };

    const getTimeRemaining = (expiresAt?: string) => {
        if (!expiresAt) return null;

        const now = new Date();
        const expiry = new Date(expiresAt);
        const diff = expiry.getTime() - now.getTime();

        if (diff < 0) return "Expired";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days}d ${hours}h left`;
        if (hours > 0) return `${hours}h left`;
        return "< 1h left";
    };

    if (loading) {
        return (
            <div className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                    <h2 className="text-lg font-semibold text-slate-900">Action Required</h2>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                    ))}
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
                {actions.map((action) => (
                    <Link
                        key={action.id}
                        href={getActionLink(action) as any}
                        className="block bg-white rounded-lg p-4 border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-200 transition-colors">
                                {getActionIcon(action.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 group-hover:text-amber-900 transition-colors">
                                    {getActionText(action)}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-slate-600">{action.ladder_name}</span>
                                    {action.expires_at && (
                                        <>
                                            <span className="text-xs text-slate-400">•</span>
                                            <span className="text-xs text-amber-600 font-medium">
                                                {getTimeRemaining(action.expires_at)}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex-shrink-0">
                                <svg
                                    className="h-5 w-5 text-amber-600 group-hover:translate-x-1 transition-transform"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
