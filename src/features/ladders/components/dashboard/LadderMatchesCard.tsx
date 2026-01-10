"use client";

import { useEffect, useState } from "react";
import { Target, Clock } from "lucide-react";

interface Match {
    id: string;
    status: string;
    created_at: string;
    player1: { full_name: string | null; email: string };
    player2: { full_name: string | null; email: string };
}

interface Props {
    ladderId: string;
}

export function LadderMatchesCard({ ladderId }: Props) {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMatches();
    }, [ladderId]);

    const fetchMatches = async () => {
        try {
            // Fetch all matches and filter client-side
            const res = await fetch(`/api/matches?ladderId=${ladderId}&limit=10`);
            const data = await res.json();
            // Show Pending (scheduled) and Submitted (awaiting confirmation) matches
            const activeMatches = (data.matches || []).filter((m: Match) =>
                m.status === 'Pending' || m.status === 'Submitted'
            );
            setMatches(activeMatches.slice(0, 5)); // Limit to 5
        } catch (error) {
            console.error("Failed to fetch ladder matches:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="card p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-slate-200 rounded"></div>
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
                    Active Ladder Matches
                </h3>
                <span className="text-sm text-slate-500">{matches.length} in progress</span>
            </div>

            {matches.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No active matches</p>
                    <p className="text-xs mt-1">Matches will appear here once challenges are accepted</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {matches.map((match) => (
                        <div key={match.id} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">
                                        <span className="text-blue-600">
                                            {match.player1.full_name || match.player1.email.split('@')[0]}
                                        </span>
                                        {" vs "}
                                        <span className="text-green-600">
                                            {match.player2.full_name || match.player2.email.split('@')[0]}
                                        </span>
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-xs text-slate-500">
                                            <Clock className="h-3 w-3 inline mr-1" />
                                            {new Date(match.created_at).toLocaleDateString()}
                                        </p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${match.status === "Submitted"
                                                ? "bg-amber-100 text-amber-700"
                                                : "bg-blue-100 text-blue-700"
                                            }`}>
                                            {match.status === "Submitted" ? "Confirming" : "Scheduled"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
