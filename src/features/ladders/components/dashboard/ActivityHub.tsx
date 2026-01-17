"use client";

import { Swords, Target, ArrowRight, Clock, UserPlus, UserMinus, Layers, ChevronDown, ChevronUp, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";

interface RankHistoryItem {
    id: string;
    old_rank: number;
    new_rank: number;
    created_at: string;
    user?: {
        full_name: string | null;
        email: string;
        avatar_url: string | null;
    };
}

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
    rankHistory?: RankHistoryItem[];
    currentUserId: string;
    ladderId: string;
}

export function ActivityHub({ challenges, matches, membershipEvents, rankHistory = [], currentUserId, ladderId }: ActivityHubProps) {
    const [expanded, setExpanded] = useState({
        matches: true,
        challenges: true,
        ranks: true,
        membership: true
    });

    const toggleSection = (section: keyof typeof expanded) => {
        setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
    };

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
        return setScores.map((set: any) => {
            if (typeof set === 'string') return set;
            if (typeof set === 'object' && (set.player1 !== undefined || set.p1 !== undefined)) {
                return `${set.player1 || set.p1}-${set.player2 || set.p2}`;
            }
            return String(set);
        }).join(', ');
    };

    // Filter Lists
    const pendingChallenges = challenges.filter(c => c.status === 'Pending' || c.status === 'pending');

    // Group Matches Logic (Consecutive)
    const groupedMatches: { items: any[], key: string }[] = [];
    const sortedMatches = [...matches].sort((a, b) => new Date(b.created_at || b.scheduled_at).getTime() - new Date(a.created_at || a.scheduled_at).getTime()).slice(0, 30);

    sortedMatches.forEach(m => {
        const p1 = m.player1_id;
        const p2 = m.player2_id;
        const key = [p1, p2].sort().join('-');

        const lastGroup = groupedMatches[groupedMatches.length - 1];
        if (lastGroup && lastGroup.key === key) {
            lastGroup.items.push(m);
        } else {
            groupedMatches.push({ items: [m], key });
        }
    });

    const displayMatches = groupedMatches.slice(0, 5); // Show top 5 groups

    const renderHeader = (title: string, count: number, section: keyof typeof expanded, icon: any) => (
        <button
            onClick={() => toggleSection(section)}
            className="w-full flex items-center justify-between p-3 bg-white hover:bg-slate-50 border-b border-slate-100 transition-colors first:rounded-t-xl"
        >
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-sm font-semibold text-slate-800">{title}</span>
                {count > 0 && (
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {count}
                    </span>
                )}
            </div>
            {expanded[section] ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
    );

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-brand-600" />
                    Activity Hub
                </h3>
            </div>

            {/* Matches Section */}
            <div>
                {renderHeader("Recent Matches", displayMatches.length, 'matches', <Target className="h-4 w-4 text-blue-500" />)}
                {expanded.matches && (
                    <div className="divide-y divide-slate-100">
                        {displayMatches.length === 0 ? (
                            <p className="p-4 text-xs text-slate-400 text-center italic">No recent matches</p>
                        ) : (
                            displayMatches.map((group, idx) => {
                                const match = group.items[0];
                                const score = formatScore(match.set_scores);
                                const p1 = match.player1;
                                const p2 = match.player2;
                                if (!p1 || !p2) return null;

                                // Determine winner logic for display
                                const winnerId = match.winner_id;
                                const p1Won = winnerId === match.player1_id;

                                return (
                                    <div key={match.id} className="p-3 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="relative">
                                                    <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                                                    {group.items.length > 1 && (
                                                        <span className="absolute -bottom-1 -right-1 bg-slate-800 text-white text-[8px] w-3 h-3 flex items-center justify-center rounded-full">
                                                            {group.items.length}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-800">
                                                        {p1.full_name || p1.email?.split('@')[0]} vs {p2.full_name || p2.email?.split('@')[0]}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                        <span>{formatTimeAgo(match.created_at || match.scheduled_at)}</span>
                                                        {group.items.length > 1 && <span className="text-slate-400 font-medium">(+{group.items.length - 1} more)</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            {score && (
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-green-600">{score}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Challenges Section */}
            <div className="border-t border-slate-100">
                {renderHeader("Pending Challenges", pendingChallenges.length, 'challenges', <Swords className="h-4 w-4 text-amber-500" />)}
                {expanded.challenges && (
                    <div className="divide-y divide-slate-100">
                        {pendingChallenges.length === 0 ? (
                            <p className="p-4 text-xs text-slate-400 text-center italic">No pending challenges</p>
                        ) : (
                            pendingChallenges.slice(0, 5).map(c => {
                                const challenger = c.challenger;
                                const challenged = c.challenged;
                                if (!challenger || !challenged) return null;
                                return (
                                    <div key={c.id} className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Swords className="h-4 w-4 text-amber-500" />
                                            <div>
                                                <p className="text-xs font-medium text-slate-800">
                                                    <span className="font-bold">{challenger.full_name || challenger.email.split('@')[0]}</span> challenged <span className="font-bold">{challenged.full_name || challenged.email.split('@')[0]}</span>
                                                </p>
                                                <p className="text-[10px] text-slate-500">{formatTimeAgo(c.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Rank Updates Section */}
            <div className="border-t border-slate-100">
                {renderHeader("Rank Updates", rankHistory.length, 'ranks', <Trophy className="h-4 w-4 text-purple-500" />)}
                {expanded.ranks && (
                    <div className="divide-y divide-slate-100">
                        {rankHistory.length === 0 ? (
                            <p className="p-4 text-xs text-slate-400 text-center italic">No recent rank updates</p>
                        ) : (
                            rankHistory.slice(0, 5).map(r => {
                                const user = r.user;
                                if (!user) return null;
                                const isImprovement = r.new_rank < r.old_rank; // Lower number is better
                                return (
                                    <div key={r.id} className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <Avatar name={user.full_name} src={user.avatar_url} size="xs" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-slate-800">
                                                    {user.full_name || user.email?.split('@')[0]}
                                                </p>
                                                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                                    {isImprovement ? 'Rose to' : 'Dropped to'} <span className="font-bold">#{r.new_rank}</span>
                                                    <span className="text-slate-300">•</span>
                                                    {formatTimeAgo(r.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`text-xs font-bold ${isImprovement ? 'text-green-600' : 'text-red-600'}`}>
                                            {isImprovement ? '↑' : '↓'} {Math.abs(r.old_rank - r.new_rank)}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Membership Section */}
            <div className="border-t border-slate-100">
                {renderHeader("Membership", membershipEvents.length, 'membership', <UserPlus className="h-4 w-4 text-green-500" />)}
                {expanded.membership && (
                    <div className="divide-y divide-slate-100">
                        {membershipEvents.slice(0, 10).map(e => {
                            const user = e.user;
                            if (!user) return null;
                            const isJoined = e.event_type === 'joined';
                            return (
                                <div key={e.id} className="p-3 hover:bg-slate-50 transition-colors flex items-center gap-2">
                                    {isJoined ? <UserPlus className="h-4 w-4 text-green-500" /> : <UserMinus className="h-4 w-4 text-slate-400" />}
                                    <div>
                                        <p className="text-xs font-medium text-slate-800">
                                            {user.full_name || user.email?.split('@')[0]} {isJoined ? 'joined' : 'left'}
                                        </p>
                                        <p className="text-[10px] text-slate-500">{formatTimeAgo(e.created_at)}</p>
                                    </div>
                                </div>
                            );
                        })}
                        {membershipEvents.length === 0 && (
                            <p className="p-4 text-xs text-slate-400 text-center italic">No membership activity</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
