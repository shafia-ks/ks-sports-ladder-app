"use client";

import { useEffect, useState } from "react";
import { Swords, CheckCircle, XCircle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Challenge {
    id: string;
    status: string;
    created_at: string;
    challenger: { full_name: string | null; email: string };
    challenged: { full_name: string | null; email: string };
    challenger_id: string;
    challenged_id: string;
}

interface Props {
    userId: string;
    ladderId: string;
    onChallengeUpdate?: () => void;
}

export function MyActiveChallengesCard({ userId, ladderId, onChallengeUpdate }: Props) {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChallenges();

        // Realtime subscription for instant updates
        const supabase = createClient();
        const channel = supabase
            .channel('challenges-changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'challenges', filter: `ladder_id=eq.${ladderId}` },
                (payload) => {
                    console.log('[MyActiveChallengesCard] Challenge changed:', payload);
                    fetchChallenges();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, ladderId]);

    const fetchChallenges = async () => {
        try {
            const res = await fetch(`/api/challenges?userId=${userId}&ladderId=${ladderId}&status=Pending,Accepted`);
            const data = await res.json();
            setChallenges(data.challenges || []);
        } catch (error) {
            console.error("Failed to fetch challenges:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (challengeId: string) => {
        try {
            const res = await fetch(`/api/challenges/${challengeId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Accepted" }),
            });
            if (res.ok) {
                await fetchChallenges();
                onChallengeUpdate?.();
            }
        } catch (error) {
            console.error("Failed to accept challenge:", error);
        }
    };

    const handleDecline = async (challengeId: string) => {
        try {
            const res = await fetch(`/api/challenges/${challengeId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Declined" }),
            });
            if (res.ok) {
                await fetchChallenges();
                onChallengeUpdate?.();
            }
        } catch (error) {
            console.error("Failed to decline challenge:", error);
        }
    };

    const incoming = challenges.filter((c) => c.challenged_id === userId && c.status === "Pending");
    const outgoing = challenges.filter((c) => c.challenger_id === userId && c.status === "Pending");
    const accepted = challenges.filter((c) => c.status === "Accepted");

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
                    <Swords className="h-5 w-5 text-brand-600" />
                    My Challenges
                </h3>
                <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                        {incoming.length} Incoming
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                        {outgoing.length} Sent
                    </span>
                </div>
            </div>

            {challenges.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    <Swords className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No active challenges</p>
                    <p className="text-xs mt-1">Challenge players from the Rankings tab</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {incoming.map((challenge) => (
                        <div key={challenge.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-slate-900">
                                        {challenge.challenger.full_name || challenge.challenger.email}
                                    </p>
                                    <p className="text-xs text-slate-600 mt-1">challenged you</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        <Clock className="h-3 w-3 inline mr-1" />
                                        {new Date(challenge.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAccept(challenge.id)}
                                        className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-1"
                                    >
                                        <CheckCircle className="h-3 w-3" />
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleDecline(challenge.id)}
                                        className="btn btn-sm bg-slate-200 text-slate-700 hover:bg-slate-300 flex items-center gap-1"
                                    >
                                        <XCircle className="h-3 w-3" />
                                        Decline
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {outgoing.map((challenge) => (
                        <div key={challenge.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-slate-900">
                                        Sent to {challenge.challenged.full_name || challenge.challenged.email}
                                    </p>
                                    <p className="text-xs text-slate-600 mt-1">
                                        <Clock className="h-3 w-3 inline mr-1" />
                                        {new Date(challenge.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className="text-xs text-blue-700 font-medium">Awaiting response</span>
                            </div>
                        </div>
                    ))}

                    {accepted.map((challenge) => (
                        <div key={challenge.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-slate-900">
                                        vs {challenge.challenger_id === userId
                                            ? (challenge.challenged.full_name || challenge.challenged.email)
                                            : (challenge.challenger.full_name || challenge.challenger.email)}
                                    </p>
                                    <p className="text-xs text-green-700 font-medium mt-1">
                                        <CheckCircle className="h-3 w-3 inline mr-1" />
                                        Accepted - Match created
                                    </p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-green-600" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {challenges.length > 0 && (
                <Link
                    href={`/challenges`}
                    className="block text-center text-sm text-brand-600 hover:text-brand-700 font-medium mt-4"
                >
                    View all challenges →
                </Link>
            )}
        </div>
    );
}
