"use client";

import { useEffect, useState } from "react";
import { Target, Clock, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Match {
    id: string;
    status: string;
    created_at: string;
    player1: { full_name: string | null; email: string };
    player2: { full_name: string | null; email: string };
    player1_id: string;
    player2_id: string;
    sets: any[];
}

interface Props {
    userId: string;
    ladderId: string;
}

export function MyActiveMatchesCard({ userId, ladderId }: Props) {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMatches();
    }, [userId, ladderId]);

    const fetchMatches = async () => {
        try {
            // Fetch Pending (not yet played) and Submitted (awaiting confirmation) matches
            const res = await fetch(`/api/matches?userId=${userId}&ladderId=${ladderId}`);
            const data = await res.json();
            // Filter client-side for active matches
            const activeMatches = (data.matches || []).filter((m: Match) =>
                m.status === 'Pending' || m.status === 'Submitted'
            );
            setMatches(activeMatches);
        } catch (error) {
            console.error("Failed to fetch matches:", error);
        } finally {
            setLoading(false);
        }
    };

    const toScore = matches.filter((m) => m.status === "Pending"); // Matches ready to play
    const toConfirm = matches.filter((m) => m.status === "Submitted"); // Matches awaiting confirmation

    if (loading) {
        return (
            <div className="card p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-16 bg-slate-200 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    My Matches
                </h3>
                <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                        {toScore.length} To Score
                    </span>
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                        {toConfirm.length} To Confirm
                    </span>
                </div>
            </div>

            {matches.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No active matches</p>
                    <p className="text-xs mt-1">Matches appear here after challenges are accepted</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {toScore.map((match) => (
                        <div key={match.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-slate-900">
                                        vs {match.player1_id === userId
                                            ? (match.player2.full_name || match.player2.email)
                                            : (match.player1.full_name || match.player1.email)}
                                    </p>
                                    <p className="text-xs text-slate-600 mt-1">
                                        <Clock className="h-3 w-3 inline mr-1" />
                                        {new Date(match.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <Link
                                    href={`/ladders/${ladderId}?tab=matches`}
                                    className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    Submit Score
                                </Link>
                            </div>
                        </div>
                    ))}

                    {toConfirm.map((match) => (
                        <div key={match.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-slate-900">
                                        vs {match.player1_id === userId
                                            ? (match.player2.full_name || match.player2.email)
                                            : (match.player1.full_name || match.player1.email)}
                                    </p>
                                    <p className="text-xs text-amber-700 font-medium mt-1">
                                        <AlertCircle className="h-3 w-3 inline mr-1" />
                                        Score submitted - Awaiting confirmation
                                    </p>
                                </div>
                                <Link
                                    href={`/ladders/${ladderId}?tab=matches`}
                                    className="btn btn-sm bg-amber-600 text-white hover:bg-amber-700"
                                >
                                    Confirm
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {matches.length > 0 && (
                <Link
                    href={`/ladders/${ladderId}?tab=matches`}
                    className="block text-center text-sm text-brand-600 hover:text-brand-700 font-medium mt-4"
                >
                    View all matches →
                </Link>
            )}
        </div>
    );
}
