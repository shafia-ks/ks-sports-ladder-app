"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Calendar, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface UpcomingMatch {
    id: string;
    ladder_id: string;
    ladder_name: string;
    ladder_image?: string;
    opponent_name: string;
    opponent_avatar?: string;
    played_at: string;
    location?: string;
}

export function UpcomingMatchesWidget() {
    const { user } = useAuth();
    const [matches, setMatches] = useState<UpcomingMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchUpcomingMatches = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/dashboard/upcoming-matches?user_id=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setMatches(data.matches || []);
            }
        } catch (error) {
            console.error("Failed to fetch upcoming matches:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;

        fetchUpcomingMatches();

        // Event-Driven: Subscribe to match changes
        const channel = supabase
            .channel('upcoming-matches-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'matches',
                    filter: `player1_id=eq.${user.id}`,
                },
                () => fetchUpcomingMatches()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'matches',
                    filter: `player2_id=eq.${user.id}`,
                },
                () => fetchUpcomingMatches()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const formatMatchTime = (playedAt: string) => {
        const date = new Date(playedAt);
        const now = new Date();
        const isToday =
            date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        const isTomorrow =
            date.getDate() === now.getDate() + 1 &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        if (isToday) return `Today, ${timeStr}`;
        if (isTomorrow) return `Tomorrow, ${timeStr}`;
        return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
    };

    if (loading) {
        return (
            <div className="card p-5">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-brand-600" />
                    Upcoming Matches
                </h3>
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (matches.length === 0) {
        return (
            <div className="card p-5">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-brand-600" />
                    Upcoming Matches
                </h3>
                <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No upcoming matches scheduled</p>
                    <p className="text-xs text-slate-400 mt-1">Challenge someone to get started!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-brand-600" />
                    Upcoming Matches
                </h3>
                <Link href={"/matches" as any} className="text-xs font-medium text-brand-600 hover:text-brand-700">
                    View all
                </Link>
            </div>

            <div className="space-y-3">
                {matches.map((match) => (
                    <div key={match.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex-shrink-0">
                                {match.ladder_image ? (
                                    <img
                                        src={match.ladder_image!}
                                        alt={match.ladder_name}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                                        {match.ladder_name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                    vs {match.opponent_name}
                                </p>
                                <p className="text-xs text-slate-500 truncate">{match.ladder_name}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-600 bg-white rounded p-2 border border-slate-100">
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-brand-500" />
                                <span>{formatMatchTime(match.played_at)}</span>
                            </div>
                            {match.location && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="truncate max-w-[100px]">{match.location}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
