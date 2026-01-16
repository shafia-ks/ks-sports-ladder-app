"use client";

import { Swords, Target, ArrowRight, Clock } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";

interface ActivityItem {
    id: string;
    type: 'challenge' | 'match';
    player1: {
        full_name: string | null;
        email: string;
        avatar_url: string | null;
    };
    player2: {
        full_name: string | null;
        email: string;
        avatar_url: string | null;
    };
    status: string;
    created_at: string;
}

interface ActivityHubProps {
    challenges: any[];
    matches: any[];
    currentUserId: string;
    ladderId: string;
}

export function ActivityHub({ challenges, matches, currentUserId, ladderId }: ActivityHubProps) {
    // Combine and sort activities
    const activities: ActivityItem[] = [
        ...challenges
            .filter(c => c.challenger_id !== currentUserId && c.challenged_id !== currentUserId)
            .map(c => ({
                id: c.id,
                type: 'challenge' as const,
                player1: c.challenger,
                player2: c.challenged,
                status: c.status,
                created_at: c.created_at,
            })),
        ...matches
            .filter(m => m.player1_id !== currentUserId && m.player2_id !== currentUserId)
            .map(m => ({
                id: m.id,
                type: 'match' as const,
                player1: m.player1,
                player2: m.player2,
                status: m.status,
                created_at: m.scheduled_at || m.created_at,
            })),
    ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5); // Show latest 5

    const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    const getStatusLabel = (item: ActivityItem) => {
        if (item.type === 'challenge') {
            return item.status === 'pending' ? 'Challenge' : 'Accepted';
        }
        return item.status === 'pending' ? 'Match' : item.status === 'submitted' ? 'Scoring' : 'Completed';
    };

    const getStatusColor = (item: ActivityItem) => {
        if (item.type === 'challenge') {
            return item.status === 'pending' ? 'text-amber-600' : 'text-green-600';
        }
        if (item.status === 'confirmed') return 'text-green-600';
        if (item.status === 'submitted') return 'text-blue-600';
        return 'text-slate-600';
    };

    if (activities.length === 0) {
        return (
            <div className="card p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                        📊 Activity Hub
                    </h3>
                </div>

                <div className="text-center py-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-50 mb-3">
                        <Target className="h-6 w-6 sm:h-7 sm:w-7 text-slate-400" />
                    </div>
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-600 mb-1">
                        All quiet on the ladder 🏆
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-slate-400">
                        Activity will appear here once challenges are made
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    📊 Activity Hub
                </h3>
                <Link
                    href={`/ladders/${ladderId}?tab=challenges`}
                    className="text-[9px] sm:text-[10px] text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
                >
                    View All
                    <ArrowRight className="h-3 w-3" />
                </Link>
            </div>

            <div className="space-y-2">
                {activities.map((activity) => {
                    const Icon = activity.type === 'challenge' ? Swords : Target;
                    const player1Name = activity.player1.full_name || activity.player1.email.split('@')[0];
                    const player2Name = activity.player2.full_name || activity.player2.email.split('@')[0];

                    return (
                        <div
                            key={activity.id}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <Icon className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${activity.type === 'challenge' ? 'text-amber-600' : 'text-blue-600'}`} />

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] sm:text-xs font-semibold text-slate-900 truncate">
                                        {player1Name}
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] text-slate-400">vs</span>
                                    <span className="text-[10px] sm:text-xs font-semibold text-slate-900 truncate">
                                        {player2Name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px]">
                                    <span className={getStatusColor(activity)}>
                                        {getStatusLabel(activity)}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-400 flex items-center gap-0.5">
                                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                        {formatTimeAgo(activity.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
