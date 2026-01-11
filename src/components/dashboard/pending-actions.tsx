import Link from "next/link";
import { AlertCircle, CheckCircle2, Swords } from "lucide-react";
import { SkeletonActionCard } from "@/components/ui/skeleton-card";
import type { Challenge, Match, User, Ladder } from "../../types";

interface PendingActionsProps {
    challenges: any[]; // TODO: Type properly
    matches: any[]; // TODO: Type properly
    loading: boolean;
}

export function PendingActions({ challenges, matches, loading }: PendingActionsProps) {
    if (loading) {
        return (
            <div className="space-y-3">
                <div className="h-7 w-40 bg-slate-200 rounded animate-pulse mb-3"></div>
                <div className="grid gap-3 md:grid-cols-2">
                    <SkeletonActionCard />
                    <SkeletonActionCard />
                </div>
            </div>
        );
    }

    const pendingChallenges = challenges.filter(c => c.status === "Pending" && !c.isChallenger);
    const pendingMatches = matches.filter(m => m.status === "Pending" || m.status === "ScoreSubmitted");

    if (pendingChallenges.length === 0 && pendingMatches.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Pending Actions
            </h2>

            <div className="grid gap-3 md:grid-cols-2">
                {pendingChallenges.map((challenge) => (
                    <div key={challenge.id} className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-amber-800 font-semibold">
                                    <Swords className="h-4 w-4" aria-hidden="true" />
                                    Challenge Request
                                </div>
                                <p className="mt-1 text-sm text-amber-900">
                                    <strong>{challenge.challenger?.full_name}</strong> challenged you in <strong>{challenge.ladder?.name || challenge.ladderName}</strong>
                                </p>
                                <p className="mt-1 text-xs text-amber-700">Expires soon • 2h left</p>
                            </div>
                            <Link
                                href="/challenges"
                                className="btn bg-amber-200 text-amber-900 hover:bg-amber-300 border-amber-300 text-xs px-3 py-1"
                                aria-label={`View challenge from ${challenge.challenger?.full_name}`}
                            >
                                View
                            </Link>
                        </div>
                        <div className="mt-3 flex gap-2">
                            <button
                                className="btn bg-amber-600 text-white hover:bg-amber-700 text-xs flex-1"
                                aria-label={`Accept challenge from ${challenge.challenger?.full_name}`}
                            >
                                Accept
                            </button>
                            <button
                                className="btn bg-white text-amber-900 border-amber-200 hover:bg-amber-100 text-xs flex-1"
                                aria-label={`Decline challenge from ${challenge.challenger?.full_name}`}
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                ))}

                {pendingMatches.map((match) => (
                    <div key={match.id} className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-orange-800 font-semibold">
                                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                                    Score Confirmation
                                </div>
                                <p className="mt-1 text-sm text-orange-900">
                                    Confirm score vs <strong>{match.opponent?.full_name || match.opponentName}</strong>
                                </p>
                                <p className="mt-1 text-xs text-orange-700">{match.score_summary || "Score pending"}</p>
                            </div>
                            <Link
                                href="/dashboard"
                                className="btn bg-orange-200 text-orange-900 hover:bg-orange-300 border-orange-300 text-xs px-3 py-1"
                                aria-label={`Verify match score against ${match.opponent?.full_name || match.opponentName}`}
                            >
                                Verify
                            </Link>
                        </div>
                        <div className="mt-3 flex gap-2">
                            <button
                                className="btn bg-orange-600 text-white hover:bg-orange-700 text-xs flex-1"
                                aria-label={`Confirm match score against ${match.opponent?.full_name || match.opponentName}`}
                            >
                                Confirm
                            </button>
                            <button
                                className="btn bg-white text-orange-900 border-orange-200 hover:bg-orange-100 text-xs flex-1"
                                aria-label={`Dispute match score against ${match.opponent?.full_name || match.opponentName}`}
                            >
                                Dispute
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
