import Link from "next/link";
import { AlertCircle, CheckCircle2, Swords } from "lucide-react";

interface PendingActionsProps {
    challenges: any[]; // TODO: Type properly
    matches: any[]; // TODO: Type properly
    loading: boolean;
}

export function PendingActions({ challenges, matches, loading }: PendingActionsProps) {
    if (loading) return null; // Or show a small skeleton if desired

    const pendingChallenges = challenges.filter(c => c.status === "pending" && !c.isChallenger);
    const pendingMatches = matches.filter(m => m.status === "pending_confirmation");

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
                                    <Swords className="h-4 w-4" />
                                    Challenge Request
                                </div>
                                <p className="mt-1 text-sm text-amber-900">
                                    <strong>{challenge.challenger?.full_name}</strong> challenged you in <strong>{challenge.ladder?.name}</strong>
                                </p>
                                <p className="mt-1 text-xs text-amber-700">Expires soon • 2h left</p>
                            </div>
                            <Link href="/challenges" className="btn bg-amber-200 text-amber-900 hover:bg-amber-300 border-amber-300 text-xs px-3 py-1">
                                View
                            </Link>
                        </div>
                        <div className="mt-3 flex gap-2">
                            <button className="btn bg-amber-600 text-white hover:bg-amber-700 text-xs flex-1">Accept</button>
                            <button className="btn bg-white text-amber-900 border-amber-200 hover:bg-amber-100 text-xs flex-1">Decline</button>
                        </div>
                    </div>
                ))}

                {pendingMatches.map((match) => (
                    <div key={match.id} className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-orange-800 font-semibold">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Score Confirmation
                                </div>
                                <p className="mt-1 text-sm text-orange-900">
                                    Confirm score vs <strong>{match.opponent?.full_name}</strong>
                                </p>
                                <p className="mt-1 text-xs text-orange-700">{match.score_summary}</p>
                            </div>
                            <Link href="/dashboard" className="btn bg-orange-200 text-orange-900 hover:bg-orange-300 border-orange-300 text-xs px-3 py-1">
                                Verify
                            </Link>
                        </div>
                        <div className="mt-3 flex gap-2">
                            <button className="btn bg-orange-600 text-white hover:bg-orange-700 text-xs flex-1">Confirm</button>
                            <button className="btn bg-white text-orange-900 border-orange-200 hover:bg-orange-100 text-xs flex-1">Dispute</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
