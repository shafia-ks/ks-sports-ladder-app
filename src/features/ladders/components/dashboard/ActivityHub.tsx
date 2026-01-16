"use client";

import { Swords, Target, ArrowRight, Clock, UserPlus, UserMinus } from "lucide-react";
import Link from "next/link";

interface ActivityItem {
    id: string;
    type: 'challenge' | 'match' | 'membership';
    player1?: {
        full_name: string | null;
        email: string;
        avatar_url: string | null;
    };
    player2?: {
        full_name: string | null;
        email: string;
        avatar_url: string | null;
    };
    user?: {
        full_name: string | null;
        email: string;
        avatar_url: string | null;
    };
    status?: string;
    created_at: string;
    winner_id?: string;
    player1_id?: string;
    player2_id?: string;
    set_scores?: any;
    challenger_rank?: number;
    challenged_rank?: number;
    player1_rank?: number;
    player2_rank?: number;
    event_type?: 'joined' | 'left';
}

interface ActivityHubProps {
    challenges: any[];
    matches: any[];
    membershipEvents: any[];
    currentUserId: string;
    ladderId: string;
}

export function ActivityHub({ challenges, matches, membershipEvents, currentUserId, ladderId }: ActivityHubProps) {
    // Combine and sort activities
    const activities: ActivityItem[] = [
        ...challenges
            .map(c => ({
                id: c.id,
                type: 'challenge' as const,
                player1: c.challenger,
                player2: c.challenged,
                player1_id: c.challenger_id,
                player2_id: c.challenged_id,
                status: c.status,
                created_at: c.created_at,
                challenger_rank: c.challenger_rank,
                challenged_rank: c.challenged_rank,
            })),
        ...matches
            .map(m => ({
                id: m.id,
                type: 'match' as const,
                player1: m.player1,
                player2: m.player2,
                player1_id: m.player1_id,
                player2_id: m.player2_id,
                status: m.status,
                created_at: m.scheduled_at || m.created_at,
                winner_id: m.winner_id,
                set_scores: m.set_scores,
                player1_rank: m.player1_rank,
                player2_rank: m.player2_rank,
            })),
        ...membershipEvents
            .map(e => ({
                id: e.id,
                type: 'membership' as const,
                user: e.users,
                event_type: e.event_type,
                created_at: e.created_at,
            })),
    ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10); // Show latest 10

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

    const formatScore = (setScores: any) => {
        if (!setScores || !Array.isArray(setScores)) return null;
        return setScores.map((set: any) => `${set.player1}-${set.player2}`).join(', ');
    };

    const getActivityText = (item: ActivityItem) => {
        // Handle membership events
        if (item.type === 'membership') {
            const userName = item.user?.full_name || item.user?.email?.split('@')[0] || 'Someone';
            return {
                text: item.event_type === 'joined' ? `${userName} joined the ladder` : `${userName} left the ladder`,
                status: item.event_type === 'joined' ? 'New member' : 'Member left',
                isMembership: true,
            };
        }

        // For challenges and matches, player1 and player2 are required
        if (!item.player1 || !item.player2) {
            return { text: 'Activity', status: '' };
        }

        const player1Name = item.player1.full_name || item.player1.email.split('@')[0];
        const player2Name = item.player2.full_name || item.player2.email.split('@')[0];

        // Show ranks if available
        const player1Rank = item.type === 'challenge' ? item.challenger_rank : item.player1_rank;
        const player2Rank = item.type === 'challenge' ? item.challenged_rank : item.player2_rank;

        const player1Display = player1Rank ? `#${player1Rank} ${player1Name}` : player1Name;
        const player2Display = player2Rank ? `#${player2Rank} ${player2Name}` : player2Name;

        if (item.type === 'challenge') {
            return {
                text: `${player1Display} challenged ${player2Display}`,
                status: item.status === 'Pending' ? 'Challenge sent' : 'Challenge accepted',
            };
        }

        // For matches
        if (item.status === 'Confirmed' && item.winner_id && item.player1 && item.player2) {
            const winner = item.winner_id === item.player1_id ? item.player1 : item.player2;
            const loser = item.winner_id === item.player1_id ? item.player2 : item.player1;
            const winnerName = winner.full_name || winner.email.split('@')[0];
            const loserName = loser.full_name || loser.email.split('@')[0];
            const winnerRank = item.winner_id === item.player1_id ? player1Rank : player2Rank;
            const loserRank = item.winner_id === item.player1_id ? player2Rank : player1Rank;

            const winnerDisplay = winnerRank ? `#${winnerRank} ${winnerName}` : winnerName;
            const loserDisplay = loserRank ? `#${loserRank} ${loserName}` : loserName;

            const score = formatScore(item.set_scores);
            return {
                text: `${winnerDisplay} defeated ${loserDisplay}`,
                status: score ? `${score}` : 'Match completed',
                isWin: true,
            };
        }

        return {
            text: `${player1Display} vs ${player2Display}`,
            status: item.status === 'Pending' ? 'Match scheduled' : 'Score submitted',
        };
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
                    const Icon = activity.type === 'challenge'
                        ? Swords
                        : activity.type === 'membership'
                            ? (activity.event_type === 'joined' ? UserPlus : UserMinus)
                            : Target;
                    const activityInfo = getActivityText(activity);

                    const iconColor = activity.type === 'challenge'
                        ? 'text-amber-600'
                        : activity.type === 'membership'
                            ? (activity.event_type === 'joined' ? 'text-green-600' : 'text-slate-500')
                            : activityInfo.isWin
                                ? 'text-green-600'
                                : 'text-blue-600';

                    return (
                        <div
                            key={activity.id}
                            className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <Icon className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5 ${iconColor}`} />

                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] sm:text-xs font-semibold text-slate-900 leading-tight">
                                    {activityInfo.text}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[9px] sm:text-[10px]">
                                    <span className={`${activityInfo.isWin ? 'text-green-600' : 'text-slate-600'} font-medium`}>
                                        {activityInfo.status}
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
