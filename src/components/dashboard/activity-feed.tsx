import Link from "next/link";
import { Calendar, CheckCircle2, Clock, Trophy, XCircle } from "lucide-react";
import { SkeletonList } from "@/components/ui/skeleton-card";

interface ActivityFeedProps {
    activeChallenges: any[];
    recentMatches: any[];
    loading: boolean;
    userId: string;
}

export function ActivityFeed({ activeChallenges, recentMatches, loading, userId }: ActivityFeedProps) {
    if (loading) {
        return (
            <div className="space-y-6">
                <SkeletonList items={3} />
                <SkeletonList items={3} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Active Challenges Section */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
                    Active Challenges
                </h3>
                {activeChallenges.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2">No active challenges scheduled.</p>
                ) : (
                    <div className="space-y-3">
                        {activeChallenges.map((challenge) => (
                            <div key={challenge.id} className="flex items-start gap-4 rounded-lg bg-white p-3 shadow-sm border border-slate-100">
                                <div className="rounded-full bg-blue-50 p-2">
                                    <Clock className="h-4 w-4 text-brand-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">
                                        vs {challenge.opponentName}
                                    </p>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                        <span className="font-medium text-slate-600">{challenge.ladderName}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {challenge.scheduledFor || "Scheduled"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Matches Section */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
                    Recent Matches
                </h3>
                {recentMatches.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2">No completed matches yet.</p>
                ) : (
                    <div className="space-y-3">
                        {recentMatches.map((match) => {
                            const isWinner = match.winnerId === userId;
                            return (
                                <div key={match.id} className="flex items-start gap-4 rounded-lg bg-white p-3 shadow-sm border border-slate-100">
                                    <div className={`rounded-full p-2 ${isWinner ? "bg-green-50" : "bg-red-50"}`}>
                                        {isWinner ? (
                                            <Trophy className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">
                                            {isWinner ? "Won" : "Lost"} vs {match.opponentName}
                                        </p>
                                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                            {match.score && <span className="font-mono bg-slate-100 px-1 rounded">{match.score}</span>}
                                            <span>•</span>
                                            <span className="font-medium text-slate-600">{match.ladderName}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="pt-2">
                <Link href="/matches" className="block w-full text-center text-xs font-semibold text-brand-600 hover:text-brand-700 py-2 bg-slate-50 rounded-lg hover:bg-brand-50 transition-colors">
                    View All Activity
                </Link>
            </div>
        </div>
    );
}
