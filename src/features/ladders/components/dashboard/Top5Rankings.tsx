import { Avatar } from "@/components/ui/avatar";
import { Swords, Lock, Clock } from "lucide-react";
import Link from "next/link";

interface Player {
    id: string;
    user_id: string;
    current_rank: number | null;
    users?: {
        full_name: string | null;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        avatar_url: string | null;
    } | null;
    is_busy?: boolean;
}

interface Top5RankingsProps {
    players: Player[];
    currentUserId?: string;
    ladderId: string;
    canChallenge: (targetRank: number) => boolean;
    onChallenge: (playerId: string) => void;
    onViewFullRankings?: () => void;
}

export function Top5Rankings({ players, currentUserId, ladderId, canChallenge, onChallenge, onViewFullRankings }: Top5RankingsProps) {
    const top5 = players.slice(0, 5);

    const getDisplayName = (player: Player) => {
        return player.users?.full_name ||
            `${player.users?.first_name || ''} ${player.users?.last_name || ''}`.trim() ||
            player.users?.email ||
            "Unknown";
    };

    const getRankBadge = (rank: number) => {
        if (rank === 1) return "bg-yellow-500 text-white";
        if (rank === 2) return "bg-slate-400 text-white";
        if (rank === 3) return "bg-orange-600 text-white";
        return "bg-slate-200 text-slate-700";
    };

    return (
        <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Top 5 Rankings</h2>
            <div className="space-y-3">
                {top5.map((player) => {
                    const isCurrentUser = player.user_id === currentUserId;
                    const isBusy = player.is_busy;

                    // Simple eligible check based on rank and own busy status
                    // Note: We don't have current user's busy status strictly here unless we find them in the list or passed in.
                    // But blocking the challenge button itself if target is busy is good enough.
                    const eligible = player.current_rank
                        ? canChallenge(player.current_rank)
                        : false;

                    const displayName = getDisplayName(player);

                    return (
                        <div
                            key={player.id}
                            className={`flex items-center gap-3 p-3 rounded-lg ${isCurrentUser ? "bg-brand-50 border-2 border-brand-200" : "bg-slate-50"
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadge(player.current_rank || 0)}`}>
                                #{player.current_rank}
                            </div>
                            <Avatar name={displayName} email={player.users?.email} src={player.users?.avatar_url} size="sm" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                    {displayName} {isCurrentUser && <span className="text-brand-600">(You)</span>}
                                </p>
                                {isBusy && (
                                    <div className="flex items-center gap-1 text-xs text-amber-600 font-medium mt-0.5">
                                        <Clock className="h-3 w-3" />
                                        <span>Busy</span>
                                    </div>
                                )}
                            </div>
                            {!isCurrentUser && (
                                <div>
                                    {eligible ? (
                                        <button
                                            onClick={() => onChallenge(player.user_id)}
                                            disabled={isBusy}
                                            className={`btn btn-sm flex items-center gap-1 ${isBusy ? "bg-amber-100 text-amber-700 cursor-not-allowed hover:bg-amber-100" : "btn-primary"}`}
                                            aria-label={isBusy ? `Cannot challenge ${displayName}, player is busy` : `Challenge ${displayName}`}
                                        >
                                            {isBusy ? <Lock className="h-3 w-3" aria-hidden="true" /> : <Swords className="h-3 w-3" aria-hidden="true" />}
                                            {isBusy ? "Busy" : "Challenge"}
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="btn btn-sm bg-slate-200 text-slate-500 cursor-not-allowed flex items-center gap-1"
                                            title="Out of challenge range"
                                            aria-label={`Cannot challenge ${displayName}, out of rank range`}
                                        >
                                            <Lock className="h-3 w-3" aria-hidden="true" />
                                            Locked
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {
                onViewFullRankings && (
                    <button
                        onClick={onViewFullRankings}
                        className="block text-center text-sm text-brand-600 hover:text-brand-700 font-medium mt-4 w-full"
                    >
                        View Full Rankings →
                    </button>
                )
            }
        </div >
    );
}
