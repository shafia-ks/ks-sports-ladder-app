"use client";

import { useState } from "react";
import { Swords, Target, Clock, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

interface Challenge {
    id: string;
    challenger_id: string;
    challenged_id: string;
    status: string;
    expires_at: string;
    challenger: {
        full_name: string | null;
        email: string;
        avatar_url: string | null;
    };
    challenged: {
        full_name: string | null;
        email: string;
        avatar_url: string | null;
    };
    challenger_rank?: number;
    challenged_rank?: number;
}

interface Match {
    id: string;
    player1_id: string;
    player2_id: string;
    status: string;
    scheduled_at: string | null;
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
    set_scores?: string[] | null;
}

interface MyActionsCardProps {
    challenges: Challenge[];
    matches: Match[];
    currentUserId: string;
    ladderId: string;
    onChallengeAction?: (challengeId: string, action: 'accept' | 'decline') => Promise<void>;
}

export function MyActionsCard({
    challenges,
    matches,
    currentUserId,
    ladderId,
    onChallengeAction
}: MyActionsCardProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    // Find the user's active challenge (incoming or outgoing)
    const myChallenge = challenges.find(
        c => (c.challenger_id === currentUserId || c.challenged_id === currentUserId) &&
            c.status === 'pending'
    );

    // Find the user's active match
    const myMatch = matches.find(
        m => (m.player1_id === currentUserId || m.player2_id === currentUserId) &&
            (m.status === 'pending' || m.status === 'submitted')
    );

    const handleChallengeAction = async (action: 'accept' | 'decline') => {
        if (!myChallenge || !onChallengeAction) return;
        setLoading(action);
        try {
            await onChallengeAction(myChallenge.id, action);
        } finally {
            setLoading(null);
        }
    };

    const handleMatchAction = () => {
        if (!myMatch) return;
        router.push(`/ladders/${ladderId}?tab=matches`);
    };

    // Determine what to show
    const hasAction = myChallenge || myMatch;
    const actionCount = (myChallenge ? 1 : 0) + (myMatch ? 1 : 0);

    // If there's a challenge, prioritize it
    if (myChallenge) {
        const isIncoming = myChallenge.challenged_id === currentUserId;
        const opponent = isIncoming ? myChallenge.challenger : myChallenge.challenged;
        const opponentRank = isIncoming ? myChallenge.challenger_rank : myChallenge.challenged_rank;
        const timeLeft = myChallenge.expires_at
            ? Math.max(0, Math.floor((new Date(myChallenge.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : null;

        return (
            <div className="card p-4 sm:p-5 border-l-4 border-amber-500">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Swords className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                        My Actions
                    </h3>
                    {actionCount > 0 && (
                        <span className="bg-amber-500 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full">
                            {actionCount}
                        </span>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Avatar
                            name={opponent.full_name}
                            email={opponent.email}
                            src={opponent.avatar_url}
                            size="sm"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] sm:text-xs font-semibold text-slate-900 truncate">
                                {isIncoming ? 'Challenge from' : 'Challenge to'} {opponent.full_name || opponent.email.split('@')[0]}
                            </p>
                            <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-slate-500">
                                {opponentRank && <span>Rank #{opponentRank}</span>}
                                {timeLeft !== null && (
                                    <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {timeLeft}d left
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {isIncoming ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleChallengeAction('accept')}
                                disabled={loading !== null}
                                className="flex-1 py-2 px-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all font-semibold text-[10px] sm:text-xs disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                                {loading === 'accept' ? (
                                    'Accepting...'
                                ) : (
                                    <>
                                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                        Accept
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => handleChallengeAction('decline')}
                                disabled={loading !== null}
                                className="flex-1 py-2 px-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-semibold text-[10px] sm:text-xs disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                                {loading === 'decline' ? (
                                    'Declining...'
                                ) : (
                                    <>
                                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                        Decline
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                            <p className="text-[9px] sm:text-[10px] text-amber-800 text-center">
                                Waiting for {opponent.full_name || opponent.email.split('@')[0]} to respond
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // If there's a match
    if (myMatch) {
        const opponent = myMatch.player1_id === currentUserId ? myMatch.player2 : myMatch.player1;
        const needsScore = myMatch.status === 'pending';
        const needsConfirmation = myMatch.status === 'submitted';

        return (
            <div className="card p-4 sm:p-5 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        My Actions
                    </h3>
                    {actionCount > 0 && (
                        <span className="bg-blue-500 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full">
                            {actionCount}
                        </span>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Avatar
                            name={opponent.full_name}
                            email={opponent.email}
                            src={opponent.avatar_url}
                            size="sm"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] sm:text-xs font-semibold text-slate-900 truncate">
                                Match vs {opponent.full_name || opponent.email.split('@')[0]}
                            </p>
                            <p className="text-[9px] sm:text-[10px] text-slate-500">
                                {needsScore ? 'Pending • Enter Score' : 'Submitted • Confirm Result'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleMatchAction}
                        className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all font-semibold text-[10px] sm:text-xs flex items-center justify-center gap-2"
                    >
                        {needsScore ? 'Enter Score' : 'Review & Confirm'}
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                </div>
            </div>
        );
    }

    // Empty state
    return (
        <div className="card p-4 sm:p-5 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    My Actions
                </h3>
            </div>

            <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-green-50 mb-3">
                    <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                </div>
                <p className="text-[10px] sm:text-xs font-semibold text-slate-900 mb-1">
                    All caught up! 🎉
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-500">
                    Challenge someone from Rankings
                </p>
            </div>
        </div>
    );
}
