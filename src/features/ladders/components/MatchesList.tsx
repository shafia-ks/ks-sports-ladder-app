"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { MatchCard } from "@/components/matches/MatchCard";

interface Player {
    id: string;
    full_name: string | null;
    email: string;
    profile_picture_url?: string | null;
}

interface Match {
    id: string;
    ladder_id: string;
    challenge_id: string | null;
    player1_id: string;
    player2_id: string;
    winner_id: string | null;
    status: "Pending" | "ScoreSubmitted" | "Confirmed" | "Disputed";
    set_scores: string[] | null;
    played_at: string | null;
    created_at: string;
    player1: Player;
    player2: Player;
    location?: string | null;
    scheduled_time?: string | null;
    submitted_by?: string | null;
}

type FilterStatus = "all" | "Pending" | "ScoreSubmitted" | "Confirmed";

interface MatchesListProps {
    ladderId: string;
    currentUserId: string;
    isOrganizer: boolean;
}

export function MatchesList({ ladderId, currentUserId, isOrganizer }: MatchesListProps) {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterStatus>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchMatches = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/matches?ladderId=${ladderId}`);
            const data = await response.json();
            setMatches(data.matches || []);
        } catch (error) {
            console.error("Error fetching matches:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, [ladderId]);

    // Filter and search logic
    const filteredMatches = matches.filter((match) => {
        // Status filter
        if (filter !== "all" && match.status !== filter) return false;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const player1Name = (match.player1.full_name || match.player1.email).toLowerCase();
            const player2Name = (match.player2.full_name || match.player2.email).toLowerCase();
            if (!player1Name.includes(query) && !player2Name.includes(query)) return false;
        }

        return true;
    });

    // Count by status
    const counts = {
        all: matches.length,
        Pending: matches.filter((m) => m.status === "Pending").length,
        ScoreSubmitted: matches.filter((m) => m.status === "ScoreSubmitted").length,
        Confirmed: matches.filter((m) => m.status === "Confirmed").length,
    };

    return (
        <div className="space-y-6">
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Filter Tabs */}
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setFilter("all")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === "all"
                            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                    >
                        All ({counts.all})
                    </button>
                    <button
                        onClick={() => setFilter("Pending")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === "Pending"
                            ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                    >
                        Pending ({counts.Pending})
                    </button>
                    <button
                        onClick={() => setFilter("ScoreSubmitted")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === "ScoreSubmitted"
                            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                    >
                        Awaiting Confirmation ({counts.ScoreSubmitted})
                    </button>
                    <button
                        onClick={() => setFilter("Confirmed")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === "Confirmed"
                            ? "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                    >
                        Completed ({counts.Confirmed})
                    </button>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <input
                        type="text"
                        placeholder="Search by player name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        aria-label="Search matches by player name"
                    />
                </div>
            </div>

            {/* Matches List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                            <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : filteredMatches.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No matches found</h3>
                    <p className="text-slate-600">
                        {searchQuery
                            ? "Try adjusting your search query"
                            : filter !== "all"
                                ? `No ${filter.toLowerCase()} matches yet`
                                : "Matches will appear here after challenges are accepted"}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredMatches.map((match) => (
                        <MatchCard
                            key={match.id}
                            match={match}
                            currentUserId={currentUserId}
                            isOrganizer={isOrganizer}
                            onUpdate={fetchMatches}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
