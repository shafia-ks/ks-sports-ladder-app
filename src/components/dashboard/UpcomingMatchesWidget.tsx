"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Calendar, MapPin, Clock } from "lucide-react";
import Link from "next/link";

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

    useEffect(() => {
        if (!user) return;

        const fetchUpcomingMatches = async () => {
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

        fetchUpcomingMatches();

        // Refresh every minute
        const interval = setInterval(fetchUpcomingMatches, 60000);
        return () => clearInterval(interval);
    }, [user]);

    const formatMatchTime = (playedAt: string) => {
        const date = new Date(playedAt);
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const isToday = date.toDateString() === now.toDateString();
        const isTomorrow = date.toDateString() === tomorrow.toDateString();

        const timeStr = date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });

        if (isToday) return `Today, ${timeStr}`;
        if (isTomorrow) return `Tomorrow, ${timeStr}`;

        const dateStr = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
        return `${dateStr}, ${timeStr}`;
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
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-brand-600" />
                Upcoming Matches
            </h3>

            <div className="space-y-3">
                {matches.map((match) => (
                    <Link
                        key={match.id}
                        href={`/ladders/${match.ladder_id}/matches`}
                        className="block bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors border border-slate-200 hover:border-brand-300"
                    >
                        <div className="flex items-start gap-3">
                            {/* Ladder Avatar */}
                            {match.ladder_image ? (
                                <img
                                    src={match.ladder_image}
                                    alt={match.ladder_name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                    {match.ladder_name.charAt(0).toUpperCase()}
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 text-sm">
                                    vs {match.opponent_name}
                                </p>
                                <p className="text-xs text-slate-600 mt-0.5">{match.ladder_name}</p>

                                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatMatchTime(match.played_at)}
                                    </span>
                                    {match.location && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {match.location}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Calendar className="h-5 w-5 text-slate-400 flex-shrink-0" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
