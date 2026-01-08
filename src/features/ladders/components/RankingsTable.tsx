import { Avatar } from "@/components/ui/avatar";
import { Swords, Lock, Clock, TrendingUp, TrendingDown, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Player {
    id: string;
    user_id: string;
    current_rank: number | null;
    users?: {
        full_name: string | null;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
    } | null;
}

interface RankingsTableProps {
    players: Player[];
    currentUserId?: string;
    ladderId: string;
    canChallenge: (targetRank: number, myRank: number | null) => boolean;
    currentUserRank: number | null;
}

export function RankingsTable({
    players,
    currentUserId,
    ladderId,
    canChallenge,
    currentUserRank
}: RankingsTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterOption, setFilterOption] = useState<"all" | "challengeable">("all");

    const getDisplayName = (player: Player) => {
        return player.users?.full_name ||
            `${player.users?.first_name || ''} ${player.users?.last_name || ''}`.trim() ||
            player.users?.email ||
            "Unknown";
    };

    const getRankBadge = (rank: number) => {
        if (rank === 1) return { bg: "bg-yellow-500", text: "text-white", medal: "🥇" };
        if (rank === 2) return { bg: "bg-slate-400", text: "text-white", medal: "🥈" };
        if (rank === 3) return { bg: "bg-orange-600", text: "text-white", medal: "🥉" };
        return { bg: "bg-slate-200", text: "text-slate-700", medal: "" };
    };

    const filteredPlayers = players.filter((player) => {
        // Search filter
        const name = getDisplayName(player).toLowerCase();
        const email = player.users?.email?.toLowerCase() || "";
        const search = searchTerm.toLowerCase();
        const matchesSearch = name.includes(search) || email.includes(search);

        if (!matchesSearch) return false;

        // Challengeable filter
        if (filterOption === "challengeable") {
            if (player.user_id === currentUserId) return false;
            return player.current_rank ? canChallenge(player.current_rank, currentUserRank) : false;
        }

        return true;
    });

    return (
        <div className="card overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-slate-700">Rankings</p>
                    <span className="text-xs text-slate-500">
                        {filteredPlayers.length} {filteredPlayers.length === 1 ? "player" : "players"}
                    </span>
                </div>
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search players..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <select
                        value={filterOption}
                        onChange={(e) => setFilterOption(e.target.value as "all" | "challengeable")}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                        <option value="all">All Players</option>
                        <option value="challengeable">Players I Can Challenge</option>
                    </select>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden divide-y divide-slate-100">
                {filteredPlayers.map((player) => {
                    const isCurrentUser = player.user_id === currentUserId;
                    const eligible = player.current_rank && currentUserRank
                        ? canChallenge(player.current_rank, currentUserRank)
                        : false;
                    const displayName = getDisplayName(player);
                    const rankBadge = getRankBadge(player.current_rank || 0);

                    return (
                        <div
                            key={player.id}
                            className={`p-4 ${isCurrentUser ? "bg-brand-50" : "bg-white"}`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${rankBadge.bg} ${rankBadge.text}`}>
                                        {rankBadge.medal || `#${player.current_rank}`}
                                    </div>
                                    <Avatar name={displayName} email={player.users?.email} size="sm" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {displayName}
                                            {isCurrentUser && (
                                                <span className="ml-2 text-xs text-brand-600 font-normal">(You)</span>
                                            )}
                                        </p>
                                        {player.users?.email && (
                                            <p className="text-xs text-slate-500">{player.users.email}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {!isCurrentUser && (
                                <div className="mt-3">
                                    {eligible ? (
                                        <Link
                                            href={`/challenges/create?ladder=${ladderId}&opponent=${player.user_id}`}
                                            className="btn btn-primary btn-sm w-full inline-flex items-center justify-center gap-1"
                                        >
                                            <Swords className="h-3 w-3" />
                                            Challenge
                                        </Link>
                                    ) : (
                                        <button
                                            disabled
                                            className="btn btn-sm bg-slate-200 text-slate-500 cursor-not-allowed w-full inline-flex items-center justify-center gap-1"
                                            title="Out of challenge range"
                                        >
                                            <Lock className="h-3 w-3" />
                                            Out of Range
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Rank
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Player
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Trend
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredPlayers.map((player) => {
                            const isCurrentUser = player.user_id === currentUserId;
                            const eligible = player.current_rank && currentUserRank
                                ? canChallenge(player.current_rank, currentUserRank)
                                : false;
                            const displayName = getDisplayName(player);
                            const rankBadge = getRankBadge(player.current_rank || 0);

                            return (
                                <tr
                                    key={player.id}
                                    className={`hover:bg-slate-50 transition-colors ${isCurrentUser ? "bg-brand-50" : ""
                                        }`}
                                >
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${rankBadge.bg} ${rankBadge.text}`}>
                                                {rankBadge.medal || `#${player.current_rank}`}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={displayName} email={player.users?.email} size="sm" />
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {displayName}
                                                    {isCurrentUser && (
                                                        <span className="ml-2 text-xs text-brand-600 font-normal">(You)</span>
                                                    )}
                                                </p>
                                                {player.users?.email && (
                                                    <p className="text-xs text-slate-500">{player.users.email}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        {/* Placeholder for trend - can be enhanced later */}
                                        <span className="text-slate-400">—</span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        {!isCurrentUser && (
                                            <>
                                                {eligible ? (
                                                    <Link
                                                        href={`/challenges/create?ladder=${ladderId}&opponent=${player.user_id}`}
                                                        className="btn btn-primary btn-sm inline-flex items-center gap-1"
                                                    >
                                                        <Swords className="h-3 w-3" />
                                                        Challenge
                                                    </Link>
                                                ) : (
                                                    <button
                                                        disabled
                                                        className="btn btn-sm bg-slate-200 text-slate-500 cursor-not-allowed inline-flex items-center gap-1"
                                                        title="Out of challenge range"
                                                    >
                                                        <Lock className="h-3 w-3" />
                                                        Out of Range
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {filteredPlayers.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    <p className="text-sm">No players found</p>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="text-xs text-brand-600 hover:text-brand-700 mt-2"
                        >
                            Clear search
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
