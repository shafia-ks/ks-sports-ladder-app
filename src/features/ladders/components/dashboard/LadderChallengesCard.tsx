"use client";

import { useEffect, useState } from "react";
import { Swords, Clock } from "lucide-react";

interface Challenge {
    id: string;
    status: string;
    created_at: string;
    challenger: { full_name: string | null; email: string };
    challenged: { full_name: string | null; email: string };
}

interface Props {
    ladderId: string;
}

export function LadderChallengesCard({ ladderId }: Props) {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChallenges();
    }, [ladderId]);

    const fetchChallenges = async () => {
        try {
            // Only fetch Pending challenges - Accepted challenges are now matches
            const res = await fetch(`/api/challenges?ladderId=${ladderId}&status=Pending&limit=5`);
            const data = await res.json();
            setChallenges(data.challenges || []);
        } catch (error) {
            console.error("Failed to fetch ladder challenges:", error);
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
                    <Swords className="h-5 w-5 text-purple-600" />
                    Active Ladder Challenges
                </h3>
                <span className="text-sm text-slate-500">{challenges.length} active</span>
            </div>

            {challenges.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    <Swords className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No active challenges</p>
                    <p className="text-xs mt-1">All quiet on the ladder</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {challenges.map((challenge) => (
                        <div key={challenge.id} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">
                                        <span className="text-brand-600">
                                            {challenge.challenger.full_name || challenge.challenger.email.split('@')[0]}
                                        </span>
                                        {" vs "}
                                        <span className="text-purple-600">
                                            {challenge.challenged.full_name || challenge.challenged.email.split('@')[0]}
                                        </span>
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-xs text-slate-500">
                                            <Clock className="h-3 w-3 inline mr-1" />
                                            {new Date(challenge.created_at).toLocaleDateString()}
                                        </p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${challenge.status === "Accepted"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-amber-100 text-amber-700"
                                            }`}>
                                            {challenge.status}
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
