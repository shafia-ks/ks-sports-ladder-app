"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface RecentActivity {
    id: string;
    ladder_id: string;
    ladder_name: string;
    opponent_name: string;
    won: boolean;
    set_scores: string[];
    played_at: string;
    rank_change?: number;
}

export function RecentActivityFeed() {
    const { user } = useAuth();
    const [activities, setActivities] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchRecentActivity = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/dashboard/recent-activity?user_id=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setActivities(data.activities || []);
            }
        } catch (error) {
            console.error("Failed to fetch recent activity:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;

        fetchRecentActivity();

        // Event-Driven: Subscribe to match changes
        const channel = supabase
            .channel('recent-activity-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'matches',
                    filter: `player1_id=eq.${user.id}`,
                },
                () => fetchRecentActivity()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'matches',
                    filter: `player2_id=eq.${user.id}`,
                },
                () => fetchRecentActivity()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const formatTimeAgo = (playedAt: string) => {
        const now = new Date();
        const played = new Date(playedAt);
        const diffMs = now.getTime() - played.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays}d ago`;
        return played.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="card p-5">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-brand-600" />
                    Recent Activity
                </h3>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="card p-5">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-brand-600" />
                    Recent Activity
                </h3>
                <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No recent matches</p>
                    <p className="text-xs text-slate-400 mt-1">Play your first match to see activity here</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-brand-600" />
                Recent Activity
            </h3>

            <div className="space-y-3">
                {activities.map((activity) => (
                    <Link
                        key={activity.id}
                        href={`/ladders/${activity.ladder_id}/matches` as any}
                        className="block group"
                    >
                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                            {/* Win/Loss Icon */}
                            <div
                                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${activity.won
                                    ? "bg-green-100 text-green-600"
                                    : "bg-red-100 text-red-600"
                                    }`}
                            >
                                {activity.won ? (
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900 group-hover:text-brand-700 transition-colors">
                                            {activity.won ? "Won" : "Lost"} vs {activity.opponent_name}
                                        </p>
                                        <p className="text-xs text-slate-600 mt-0.5">{activity.ladder_name}</p>
                                    </div>

                                    {activity.rank_change !== undefined && activity.rank_change !== 0 && (
                                        <div
                                            className={`flex items-center gap-1 text-xs font-medium ${activity.rank_change > 0
                                                ? "text-green-600"
                                                : "text-red-600"
                                                }`}
                                        >
                                            {activity.rank_change > 0 ? (
                                                <TrendingUp className="h-3 w-3" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3" />
                                            )}
                                            {Math.abs(activity.rank_change)} rank{Math.abs(activity.rank_change) > 1 ? "s" : ""}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-1">
                                    {activity.set_scores && activity.set_scores.length > 0 && (
                                        <span className="text-xs text-slate-500">
                                            {activity.set_scores.join(", ")}
                                        </span>
                                    )}
                                    <span className="text-xs text-slate-400">•</span>
                                    <span className="text-xs text-slate-500">
                                        {formatTimeAgo(activity.played_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
