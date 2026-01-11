"use client";

import { useState } from "react";
import { Calendar, Clock, MapPin, ChevronDown, ChevronUp, Trophy, Plus, Search } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/avatar";
import { useAnalytics } from "@/lib/analytics/tracker";

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
    status: "Pending" | "Submitted" | "Confirmed" | "Disputed";
    set_scores: string[] | null;
    played_at: string | null;
    created_at: string;
    player1: Player;
    player2: Player;
    location?: string | null;
    scheduled_time?: string | null;
}

interface MatchCardProps {
    match: Match;
    currentUserId: string;
    isOrganizer: boolean;
    onUpdate: () => void;
}

export function MatchCard({ match, currentUserId, isOrganizer, onUpdate }: MatchCardProps) {
    const { push: showToast } = useToast();
    const { trackEvent } = useAnalytics();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [loading, setLoading] = useState(false);

    // Score state
    const [sets, setSets] = useState<Array<{ player1: number; player2: number }>>(
        match.set_scores?.map((score) => {
            const [p1, p2] = score.split("-").map(Number);
            return { player1: p1, player2: p2 };
        }) || [
            { player1: 0, player2: 0 },
            { player1: 0, player2: 0 },
            { player1: 0, player2: 0 },
        ]
    );

    // Match details state
    const [matchDate, setMatchDate] = useState(match.played_at?.split("T")[0] || "");
    const [matchTime, setMatchTime] = useState(
        match.scheduled_time || match.played_at?.split("T")[1]?.substring(0, 5) || ""
    );
    const [location, setLocation] = useState(match.location || "");

    // Calculate winner
    const calculateWinner = () => {
        const player1Wins = sets.filter((s) => s.player1 > s.player2).length;
        const player2Wins = sets.filter((s) => s.player2 > s.player1).length;

        if (player1Wins > player2Wins) return { winnerId: match.player1_id, setsWon: player1Wins };
        if (player2Wins > player1Wins) return { winnerId: match.player2_id, setsWon: player2Wins };
        return { winnerId: null, setsWon: 0 };
    };

    const { winnerId, setsWon } = calculateWinner();
    const player1SetsWon = sets.filter((s) => s.player1 > s.player2).length;
    const player2SetsWon = sets.filter((s) => s.player2 > s.player1).length;

    const addSet = () => {
        if (sets.length < 5) {
            setSets([...sets, { player1: 0, player2: 0 }]);
        }
    };

    const updateSet = (index: number, player: "player1" | "player2", value: string) => {
        const newSets = [...sets];
        newSets[index][player] = parseInt(value) || 0;
        setSets(newSets);
    };

    const handleSubmit = async () => {
        if (!winnerId) {
            showToast({
                title: "No winner detected",
                description: "Please enter valid scores to determine a winner.",
                variant: "error",
            });
            return;
        }

        setLoading(true);
        try {
            const setScores = sets.map((s) => `${s.player1}-${s.player2}`);
            const playedAt = matchDate && matchTime ? `${matchDate}T${matchTime}:00` : new Date().toISOString();

            const response = await fetch(`/api/matches/${match.id}/submit`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    set_scores: setScores,
                    winner_id: winnerId,
                    played_at: playedAt,
                    location: location || null,
                    status: "Submitted",
                }),
            });

            if (!response.ok) throw new Error("Failed to submit score");

            showToast({
                title: "Score submitted!",
                description: "Match score has been recorded successfully.",
                variant: "success",
            });

            trackEvent({ action: 'match_submitted', category: 'engagement', label: match.ladder_id });

            setIsEditing(false);
            onUpdate();
        } catch (error) {
            console.error("Error submitting score:", error);
            showToast({
                title: "Error",
                description: "Failed to submit score. Please try again.",
                variant: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDetails = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/matches/${match.id}/submit`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    played_at: matchDate && matchTime ? `${matchDate}T${matchTime}:00` : match.played_at,
                    location: location || null,
                    status: match.status, // Keep current status
                }),
            });

            if (!response.ok) throw new Error("Failed to save details");

            showToast({
                title: "Details saved!",
                description: "Match details have been updated successfully.",
                variant: "success",
            });

            setIsEditingDetails(false);
            onUpdate();
        } catch (error) {
            console.error("Error saving details:", error);
            showToast({
                title: "Error",
                description: "Failed to save details. Please try again.",
                variant: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = () => {
        switch (match.status) {
            case "Pending":
                return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">⏱ Pending</span>;
            case "Submitted":
                return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">🔵 Awaiting Confirmation</span>;
            case "Confirmed":
                return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">✓ Completed</span>;
            case "Disputed":
                return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">⚠ Disputed</span>;
        }
    };

    const getBorderColor = () => {
        switch (match.status) {
            case "Pending":
                return "border-l-orange-500";
            case "Submitted":
                return "border-l-blue-500";
            case "Confirmed":
                return "border-l-green-500";
            case "Disputed":
                return "border-l-red-500";
            default:
                return "border-l-gray-300";
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/matches/${match.id}/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: currentUserId,
                    action: "confirm",
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to confirm match");
            }

            showToast({
                title: "Match confirmed!",
                description: "The match result has been confirmed.",
                variant: "success",
            });

            trackEvent({ action: 'match_confirmed', category: 'engagement', label: match.ladder_id });

            onUpdate();
        } catch (error) {
            console.error("Error confirming match:", error);
            showToast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to confirm match. Please try again.",
                variant: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDispute = async () => {
        const reason = prompt("Please provide a reason for disputing this match:");
        if (!reason) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/matches/${match.id}/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: currentUserId,
                    action: "dispute",
                    reason,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to dispute match");
            }

            showToast({
                title: "Match disputed",
                description: "Organizers have been notified and will review the dispute.",
                variant: "warning",
            });

            onUpdate();
        } catch (error) {
            console.error("Error disputing match:", error);
            showToast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to dispute match. Please try again.",
                variant: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const canEdit = match.status === "Pending" || (match.status === "Submitted" && isOrganizer);
    const canConfirm = match.status === "Submitted" &&
        (match.player1_id === currentUserId || match.player2_id === currentUserId);

    return (
        <div className={`bg-white rounded-2xl shadow-sm border-l-4 ${getBorderColor()} p-6 hover:shadow-md transition-shadow`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    {getStatusBadge()}

                    {/* Players */}
                    <div className="flex items-center gap-3 mt-3">
                        <div className={`flex items-center gap-2 ${winnerId === match.player1_id && match.status === "Confirmed" ? "font-bold" : ""}`}>
                            <Avatar
                                name={match.player1.full_name}
                                email={match.player1.email}
                                src={match.player1.profile_picture_url}
                                size="md"
                            />
                            <span className="text-slate-900">
                                {match.player1.full_name || match.player1.email.split("@")[0]}
                            </span>
                            {winnerId === match.player1_id && match.status === "Confirmed" && <Trophy className="h-4 w-4 text-yellow-500" />}
                        </div>

                        <span className="text-slate-400 font-medium">VS</span>

                        <div className={`flex items-center gap-2 ${winnerId === match.player2_id && match.status === "Confirmed" ? "font-bold" : ""}`}>
                            <Avatar
                                name={match.player2.full_name}
                                email={match.player2.email}
                                src={match.player2.profile_picture_url}
                                size="md"
                            />
                            <span className="text-slate-900">
                                {match.player2.full_name || match.player2.email.split("@")[0]}
                            </span>
                            {winnerId === match.player2_id && match.status === "Confirmed" && <Trophy className="h-4 w-4 text-yellow-500" />}
                        </div>
                    </div>

                    {/* Match Info (if available and not editing) */}
                    {!isEditing && (matchDate || matchTime || location) && (
                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
                            {matchDate && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" aria-hidden="true" />
                                    {new Date(matchDate).toLocaleDateString()}
                                </span>
                            )}
                            {matchTime && (
                                <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" aria-hidden="true" />
                                    {matchTime}
                                </span>
                            )}
                            {location && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" aria-hidden="true" />
                                    {location}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 justify-end">
                    {!isEditing && !isEditingDetails && canEdit && (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all font-medium text-sm"
                            >
                                {match.status === "Pending" ? "Enter Score →" : "Edit Score"}
                            </button>
                            <button
                                onClick={() => setIsEditingDetails(true)}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium text-sm"
                            >
                                📝 Edit Details
                            </button>
                        </>
                    )}

                    {/* Confirmation/Dispute buttons for submitted matches */}
                    {canConfirm && (
                        <>
                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all font-medium text-sm disabled:opacity-50"
                            >
                                ✓ Confirm
                            </button>
                            <button
                                onClick={handleDispute}
                                disabled={loading}
                                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 transition-all font-medium text-sm disabled:opacity-50"
                            >
                                ⚠ Dispute
                            </button>
                        </>
                    )}

                    {match.status === "Confirmed" && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            aria-label={isExpanded ? "Collapse match details" : "Expand match details"}
                        >
                            {isExpanded ? <ChevronUp className="h-5 w-5" aria-hidden="true" /> : <ChevronDown className="h-5 w-5" aria-hidden="true" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Score Display (Completed matches) */}
            {match.status === "Confirmed" && !isExpanded && match.set_scores && (
                <div className="flex items-center gap-2 mt-3">
                    {match.set_scores.map((score, idx) => (
                        <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                            {score}
                        </span>
                    ))}
                    <span className="text-sm text-slate-600 ml-2">
                        ({match.player1_id === winnerId ? match.player1.full_name || match.player1.email.split("@")[0] : match.player2.full_name || match.player2.email.split("@")[0]} won)
                    </span>
                </div>
            )}

            {/* Score Entry (Editing) */}
            {isEditing && (
                <div className="mt-4 space-y-4">
                    {/* Score Grid */}
                    <div className="bg-slate-50 rounded-xl p-4">
                        <div className="grid grid-cols-[auto_1fr] gap-3">
                            {/* Headers */}
                            <div></div>
                            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${sets.length + 1}, minmax(60px, 1fr))` }}>
                                {sets.map((_, idx) => (
                                    <div key={idx} className="text-center text-sm font-medium text-slate-600">
                                        Set {idx + 1}
                                    </div>
                                ))}
                                <div></div>
                            </div>

                            {/* Player 1 Row */}
                            <div className={`text-sm font-medium ${winnerId === match.player1_id ? "text-green-600" : "text-slate-700"}`}>
                                {match.player1.full_name || match.player1.email.split("@")[0]}
                            </div>
                            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${sets.length + 1}, minmax(60px, 1fr))` }}>
                                {sets.map((set, idx) => (
                                    <input
                                        key={idx}
                                        type="number"
                                        min="0"
                                        max="99"
                                        value={set.player1 || ""}
                                        onChange={(e) => updateSet(idx, "player1", e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg text-center font-medium ${set.player1 > set.player2 ? "bg-green-50 border-green-300" : "bg-white border-slate-300"
                                            }`}
                                        aria-label={`Player 1 Set ${idx + 1} score`}
                                    />
                                ))}
                                {sets.length < 5 && (
                                    <button
                                        onClick={addSet}
                                        className="flex items-center justify-center gap-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                                        aria-label="Add another set"
                                    >
                                        <Plus className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                )}
                            </div>

                            {/* Player 2 Row */}
                            <div className={`text-sm font-medium ${winnerId === match.player2_id ? "text-green-600" : "text-slate-700"}`}>
                                {match.player2.full_name || match.player2.email.split("@")[0]}
                            </div>
                            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${sets.length + 1}, minmax(60px, 1fr))` }}>
                                {sets.map((set, idx) => (
                                    <input
                                        key={idx}
                                        type="number"
                                        min="0"
                                        max="99"
                                        value={set.player2 || ""}
                                        onChange={(e) => updateSet(idx, "player2", e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg text-center font-medium ${set.player2 > set.player1 ? "bg-green-50 border-green-300" : "bg-white border-slate-300"
                                            }`}
                                        aria-label={`Player 2 Set ${idx + 1} score`}
                                    />
                                ))}
                                <div></div>
                            </div>
                        </div>

                        {/* Winner Indicator */}
                        {winnerId && (
                            <div className="mt-3 text-center">
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                    ✓ {winnerId === match.player1_id ? match.player1.full_name || match.player1.email.split("@")[0] : match.player2.full_name || match.player2.email.split("@")[0]} leads {Math.max(player1SetsWon, player2SetsWon)}-{Math.min(player1SetsWon, player2SetsWon)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Match Details */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date (optional)</label>
                            <input
                                type="date"
                                value={matchDate}
                                onChange={(e) => setMatchDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Time (optional)</label>
                            <input
                                type="time"
                                value={matchTime}
                                onChange={(e) => setMatchTime(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Location (optional)</label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g., Court 1"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !winnerId}
                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Submitting..." : "Submit Score"}
                        </button>
                    </div>
                </div>
            )}

            {/* Details Editing (Separate from score) */}
            {isEditingDetails && (
                <div className="mt-4 space-y-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Edit Match Details</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={matchDate}
                                    onChange={(e) => setMatchDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                                <input
                                    type="time"
                                    value={matchTime}
                                    onChange={(e) => setMatchTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g., Court 1"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={() => setIsEditingDetails(false)}
                            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveDetails}
                            disabled={loading}
                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Saving..." : "Save Details"}
                        </button>
                    </div>
                </div>
            )}

            {/* Expanded Details (Completed matches) */}
            {isExpanded && match.status === "Confirmed" && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-slate-600">Match Date:</span>
                            <span className="ml-2 font-medium">{matchDate ? new Date(matchDate).toLocaleDateString() : "Not specified"}</span>
                        </div>
                        <div>
                            <span className="text-slate-600">Location:</span>
                            <span className="ml-2 font-medium">{location || "Not specified"}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
