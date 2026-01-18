"use client";

import { useState } from "react";
import { Calendar, Clock, MapPin, ChevronDown, ChevronUp, Trophy, Plus, Minus, Search } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmModal } from "@/components/ui/confirm-modal";
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

    // Optimistic UI state
    const [optimisticStatus, setOptimisticStatus] = useState<Match["status"] | null>(null);
    const effectiveStatus = optimisticStatus || match.status;

    // Reset optimistic status when actual match status matches or changes
    if (optimisticStatus === match.status) {
        // We can't set state during render, but we can rely on useEffect or just let it exist
    }

    // Score state
    const [sets, setSets] = useState<Array<{ player1: number | ""; player2: number | "" }>>(
        match.set_scores?.map((score) => {
            const [p1, p2] = score.split("-").map(Number);
            return { player1: p1, player2: p2 };
        }) || [
            { player1: "", player2: "" },
            { player1: "", player2: "" },
            { player1: "", player2: "" },
        ]
    );

    // Match details state
    const [matchDate, setMatchDate] = useState(match.played_at?.split("T")[0] || "");
    const [matchTime, setMatchTime] = useState(
        match.scheduled_time || match.played_at?.split("T")[1]?.substring(0, 5) || ""
    );
    const [location, setLocation] = useState(match.location || "");

    const updateSet = (index: number, player: "player1" | "player2", value: string) => {
        const newSets = [...sets];
        if (value === "") {
            newSets[index][player] = "";
        } else {
            const num = parseInt(value);
            if (!isNaN(num) && num >= 0) {
                newSets[index][player] = num;
            }
        }
        setSets(newSets);
    };

    // Forfeit / Manual Winner Logic
    const [isForfeit, setIsForfeit] = useState(false);
    const [manualWinnerId, setManualWinnerId] = useState<string | null>(null);

    // Calculate winner (incorporating manual override)
    const calculateWinner = () => {
        if (isForfeit && manualWinnerId) {
            return { winnerId: manualWinnerId, setsWon: 0 }; // Sets won irrelevant for forfeit logic
        }

        const player1Wins = sets.filter((s) => (s.player1 === "" ? 0 : s.player1) > (s.player2 === "" ? 0 : s.player2)).length;
        const player2Wins = sets.filter((s) => (s.player2 === "" ? 0 : s.player2) > (s.player1 === "" ? 0 : s.player1)).length;

        if (player1Wins > player2Wins) return { winnerId: match.player1_id, setsWon: player1Wins };
        if (player2Wins > player1Wins) return { winnerId: match.player2_id, setsWon: player2Wins };
        return { winnerId: null, setsWon: 0 };
    };

    const { winnerId, setsWon } = calculateWinner();
    const player1SetsWon = sets.filter((s) => (s.player1 === "" ? 0 : s.player1) > (s.player2 === "" ? 0 : s.player2)).length;
    const player2SetsWon = sets.filter((s) => (s.player2 === "" ? 0 : s.player2) > (s.player1 === "" ? 0 : s.player1)).length;

    const addSet = () => {
        if (sets.length < 5) {
            setSets([...sets, { player1: "", player2: "" }]);
        }
    };

    const removeSet = () => {
        if (sets.length > 1) {
            setSets(sets.slice(0, -1));
        }
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
            const setScores = sets.map((s) => `${s.player1 === "" ? 0 : s.player1}-${s.player2 === "" ? 0 : s.player2}`);
            const playedAt = matchDate && matchTime ? `${matchDate}T${matchTime}:00` : new Date().toISOString();

            const response = await fetch(`/api/matches/${match.id}/submit`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    set_scores: setScores,
                    winner_id: winnerId,
                    played_at: playedAt,
                    location: location || null,
                    status: "ScoreSubmitted",
                    user_id: currentUserId,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to submit score");
            }

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
                description: error instanceof Error ? error.message : "Failed to submit score. Please try again.",
                variant: "error",
            });
            setOptimisticStatus(null); // Rollback
            onUpdate();
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
                    status: effectiveStatus, // Keep current status
                    user_id: currentUserId,
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
        switch (effectiveStatus) {
            case "Pending":
                return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">⏱ Pending</span>;
            case "ScoreSubmitted":
                return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">🔵 Awaiting Confirmation</span>;
            case "Confirmed":
                return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">✓ Completed</span>;
            case "Disputed":
                return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">⚠ Disputed</span>;
        }
    };

    const getBorderColor = () => {
        switch (effectiveStatus) {
            case "Pending":
                return "border-l-orange-500";
            case "ScoreSubmitted":
                return "border-l-blue-500";
            case "Confirmed":
                return "border-l-green-500";
            case "Disputed":
                return "border-l-red-500";
            default:
                return "border-l-gray-300";
        }
    };

    const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
    const [disputeReason, setDisputeReason] = useState("");

    const handleConfirm = async () => {
        setLoading(true);
        setOptimisticStatus("Confirmed");
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
            setOptimisticStatus(null); // Rollback
        } finally {
            setLoading(false);
        }
    };

    const submitDispute = async () => {
        if (!disputeReason.trim()) {
            showToast({
                title: "Reason required",
                description: "Please provide a reason for the dispute.",
                variant: "error",
            });
            return;
        }

        setLoading(true);
        setIsDisputeModalOpen(false);
        setOptimisticStatus("Disputed");
        try {
            const response = await fetch(`/api/matches/${match.id}/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: currentUserId,
                    action: "dispute",
                    reason: disputeReason,
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
            setDisputeReason(""); // Reset
        } catch (error) {
            console.error("Error disputing match:", error);
            showToast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to dispute match. Please try again.",
                variant: "error",
            });
            setOptimisticStatus(null); // Rollback
        } finally {
            setLoading(false);
        }
    };

    const handleDispute = () => {
        setDisputeReason("");
        setIsDisputeModalOpen(true);
    };

    const canEdit = effectiveStatus === "Pending" || (effectiveStatus === "ScoreSubmitted" && isOrganizer);

    // Players can confirm if they didn't submit, OR organizers/admins can always confirm
    const isPlayer = match.player1_id === currentUserId || match.player2_id === currentUserId;
    const canConfirm = effectiveStatus === "ScoreSubmitted" &&
        (
            // Player can confirm if they didn't submit it
            (isPlayer && currentUserId !== match.submitted_by) ||
            // Organizers can always confirm
            isOrganizer
        );

    return (
        <div className={`bg-white rounded-2xl shadow-sm border-l-4 ${getBorderColor()} p-3 sm:p-5 hover:shadow-md transition-shadow`}>
            {/* Top Row: Status Badge */}
            <div className="mb-3">
                {getStatusBadge()}
            </div>

            {/* Middle Row: Players */}
            <div className="flex items-center gap-2 mb-3">
                {/* Player 1 */}
                <div className={`flex items-center gap-2 min-w-0 flex-1 ${winnerId === match.player1_id && effectiveStatus === "Confirmed" ? "font-bold" : ""}`}>
                    <Avatar
                        name={match.player1.full_name}
                        email={match.player1.email}
                        src={match.player1.profile_picture_url}
                        size="sm"
                    />
                    <span className="text-slate-900 text-[10px] sm:text-sm font-semibold leading-tight">
                        {match.player1.full_name || match.player1.email.split("@")[0]}
                    </span>
                    {winnerId === match.player1_id && effectiveStatus === "Confirmed" && <Trophy className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
                </div>

                <div className="flex-shrink-0 text-slate-300 font-bold text-xs px-1">VS</div>

                {/* Player 2 */}
                <div className={`flex items-center gap-2 min-w-0 flex-1 ${winnerId === match.player2_id && effectiveStatus === "Confirmed" ? "font-bold" : ""}`}>
                    <Avatar
                        name={match.player2.full_name}
                        email={match.player2.email}
                        src={match.player2.profile_picture_url}
                        size="sm"
                    />
                    <span className="text-slate-900 text-[10px] sm:text-sm font-semibold leading-tight">
                        {match.player2.full_name || match.player2.email.split("@")[0]}
                    </span>
                    {winnerId === match.player2_id && effectiveStatus === "Confirmed" && <Trophy className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
                </div>
            </div>

            {/* Match Info */}
            {!isEditing && (matchDate || matchTime || location) && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3 ml-1">
                    {matchDate && (
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" aria-hidden="true" />
                            {new Date(matchDate).toLocaleDateString()}
                        </span>
                    )}
                    {matchTime && (
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {matchTime}
                        </span>
                    )}
                    {location && (
                        <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" aria-hidden="true" />
                            {location}
                        </span>
                    )}
                </div>
            )}

            {/* Actions Row - Horizontally Stacked Below */}
            <div className="flex flex-row flex-wrap items-center gap-2 w-full mt-1">
                {!isEditing && !isEditingDetails && canEdit && (
                    <>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex-1 py-1 px-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all font-bold text-[10px] sm:text-xs uppercase tracking-wide text-center"
                        >
                            {effectiveStatus === "Pending" ? "Enter Score" : "Edit Score"}
                        </button>
                        <button
                            onClick={() => setIsEditingDetails(true)}
                            className="flex-1 py-1 px-1 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-bold text-[10px] sm:text-xs uppercase tracking-wide text-center"
                        >
                            Edit Details
                        </button>
                    </>
                )}

                {canConfirm && (
                    <>
                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className="flex-1 py-1 px-1 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all font-bold text-[10px] sm:text-xs uppercase tracking-wide text-center disabled:opacity-50"
                        >
                            Confirm
                        </button>
                        <button
                            onClick={handleDispute}
                            disabled={loading}
                            className="flex-1 py-1 px-1 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 transition-all font-bold text-[10px] sm:text-xs uppercase tracking-wide text-center disabled:opacity-50"
                        >
                            Dispute
                        </button>
                    </>
                )}

                {effectiveStatus === "Confirmed" && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="ml-auto p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                        aria-label={isExpanded ? "Collapse match details" : "Expand match details"}
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
                    </button>
                )}
            </div>

            {/* Score Display (Completed, Submitted, or Disputed matches) */}
            {(effectiveStatus === "Confirmed" || effectiveStatus === "ScoreSubmitted" || effectiveStatus === "Disputed") && !isExpanded && match.set_scores && (
                <div className="flex items-center gap-2 mt-3">
                    {match.set_scores.map((score, idx) => (
                        <span key={idx} className="px-2 sm:px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] sm:text-sm font-medium">
                            {score}
                        </span>
                    ))}
                </div>
            )}

            {/* Score Entry (Editing) */}
            {isEditing && (
                <div className="mt-4 space-y-4">
                    {/* Score Grid */}
                    {/* Unified Grid Layout */}
                    <div className="bg-slate-50 rounded-xl p-4 overflow-x-auto">
                        <div
                            className="grid gap-y-2 gap-x-2 sm:gap-x-4 items-center"
                            style={{
                                gridTemplateColumns: `minmax(100px, auto) repeat(${sets.length}, minmax(44px, 1fr)) auto`,
                                gridTemplateRows: 'auto auto auto'
                            }}
                        >
                            {/* Header Row */}
                            <div className="h-6"></div> {/* Name Header Placeholder */}
                            {sets.map((_, idx) => (
                                <div key={`head-${idx}`} className="text-center text-[10px] sm:text-sm font-medium text-slate-600">
                                    Set {idx + 1}
                                </div>
                            ))}
                            <div className="h-6"></div> {/* Buttons Header Placeholder */}

                            {/* Player 1 Row */}
                            <div className={`text-[10px] sm:text-sm font-medium pr-2 truncate ${winnerId === match.player1_id ? "text-green-600" : "text-slate-700"}`}>
                                {match.player1.full_name || match.player1.email.split("@")[0]}
                            </div>
                            {sets.map((set, idx) => (
                                <input
                                    key={`p1-${idx}`}
                                    type="number"
                                    min="0"
                                    max="99"
                                    placeholder="0"
                                    value={set.player1}
                                    onChange={(e) => updateSet(idx, "player1", e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    className={`w-full h-10 px-1 border rounded-lg text-center text-sm font-medium ${(set.player1 === "" ? 0 : set.player1) > (set.player2 === "" ? 0 : set.player2)
                                        ? "bg-green-50 border-green-300"
                                        : "bg-white border-slate-300"
                                        }`}
                                    aria-label={`Player 1 Set ${idx + 1} score`}
                                />
                            ))}

                            {/* Buttons Column (Spanning 2 Rows) */}
                            <div
                                className="flex flex-col gap-1 items-center justify-center pl-2 row-span-2"
                                style={{ gridColumn: sets.length + 2, gridRow: '2 / span 2' }}
                            >
                                {sets.length < 5 && (
                                    <button
                                        onClick={addSet}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                        aria-label="Add set"
                                        title="Add Set"
                                    >
                                        <Plus className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                )}
                                {sets.length > 1 && (
                                    <button
                                        onClick={removeSet}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                        aria-label="Remove set"
                                        title="Remove Set"
                                    >
                                        <Minus className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                )}
                            </div>

                            {/* Player 2 Row */}
                            <div className={`text-[10px] sm:text-sm font-medium pr-2 truncate ${winnerId === match.player2_id ? "text-green-600" : "text-slate-700"}`}>
                                {match.player2.full_name || match.player2.email.split("@")[0]}
                            </div>
                            {sets.map((set, idx) => (
                                <input
                                    key={`p2-${idx}`}
                                    type="number"
                                    min="0"
                                    max="99"
                                    placeholder="0"
                                    value={set.player2}
                                    onChange={(e) => updateSet(idx, "player2", e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    className={`w-full h-10 px-1 border rounded-lg text-center text-sm font-medium ${(set.player2 === "" ? 0 : set.player2) > (set.player1 === "" ? 0 : set.player1)
                                        ? "bg-green-50 border-green-300"
                                        : "bg-white border-slate-300"
                                        }`}
                                    aria-label={`Player 2 Set ${idx + 1} score`}
                                />
                            ))}
                        </div>

                        {/* Winner Indicator */}
                        {winnerId && (
                            <div className="mt-3 text-center">
                                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] sm:text-sm font-medium ${isForfeit ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-700"}`}>
                                    {isForfeit ? "⚠ Forfeit Victory: " : "✓ "}
                                    {winnerId === match.player1_id ? match.player1.full_name || match.player1.email.split("@")[0] : match.player2.full_name || match.player2.email.split("@")[0]}
                                    {!isForfeit && ` leads ${Math.max(player1SetsWon, player2SetsWon)}-${Math.min(player1SetsWon, player2SetsWon)}`}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Forfeit / Retirement Option */}
                    <div className="bg-slate-50 rounded-xl p-4">
                        <label className="flex items-center gap-2 mb-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isForfeit}
                                onChange={(e) => {
                                    setIsForfeit(e.target.checked);
                                    if (!e.target.checked) setManualWinnerId(null);
                                }}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-slate-700">
                                Match ended by Retirement / Forfeit
                            </span>
                        </label>

                        {isForfeit && (
                            <div className="pl-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Select Winner (who advanced?)
                                </label>
                                <select
                                    value={manualWinnerId || ""}
                                    onChange={(e) => setManualWinnerId(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">-- Select Winner --</option>
                                    <option value={match.player1_id}>{match.player1.full_name || match.player1.email}</option>
                                    <option value={match.player2_id}>{match.player2.full_name || match.player2.email}</option>
                                </select>
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
            {isExpanded && effectiveStatus === "Confirmed" && (
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


            <ConfirmModal
                isOpen={isDisputeModalOpen}
                onClose={() => setIsDisputeModalOpen(false)}
                onConfirm={submitDispute}
                title="Dispute Match"
                message={
                    <div className="space-y-3">
                        <p className="text-sm text-slate-600">
                            Please provide a reason for disputing this match. This will notify the organizers for review.
                        </p>
                        <textarea
                            className="w-full h-24 p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                            placeholder="Enter dispute reason..."
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            autoFocus
                        />
                    </div>
                }
                confirmText="Submit Dispute"
                variant="danger"
                loading={loading}
            />
        </div>
    );
}
