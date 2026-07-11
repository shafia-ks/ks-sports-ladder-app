"use client";

import { useState } from "react";
import { Plus, Minus, Trophy, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Player {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
}

interface Match {
    id: string;
    player1: Player;
    player2: Player;
    set_scores?: string[] | null;
}

interface SubmitScoreDialogProps {
    match: Match | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function SubmitScoreDialog({ match, open, onOpenChange, onSuccess }: SubmitScoreDialogProps) {
    const { push: showToast } = useToast();
    const [loading, setLoading] = useState(false);

    // Initialize sets (default to 1 empty set or existing scores)
    const [sets, setSets] = useState<{ player1: number; player2: number }[]>(() => {
        let scoresArray: any = match?.set_scores;
        if (typeof scoresArray === "string") {
            try {
                scoresArray = JSON.parse(scoresArray);
            } catch (e) {
                scoresArray = null;
            }
        }
        if (Array.isArray(scoresArray) && scoresArray.length > 0) {
            return scoresArray.map(s => {
                if (typeof s !== 'string') return { player1: 0, player2: 0 };
                const [p1, p2] = s.split('-').map(Number);
                return { player1: p1 || 0, player2: p2 || 0 };
            });
        }
        return [{ player1: 0, player2: 0 }];
    });

    if (!open || !match) return null;

    const handleAddSet = () => {
        if (sets.length < 5) {
            setSets([...sets, { player1: 0, player2: 0 }]);
        }
    };

    const handleRemoveSet = () => {
        if (sets.length > 1) {
            setSets(sets.slice(0, -1));
        }
    };

    const handleScoreChange = (index: number, player: "player1" | "player2", value: string) => {
        const numValue = parseInt(value) || 0;
        const newSets = [...sets];
        newSets[index] = { ...newSets[index], [player]: numValue };
        setSets(newSets);
    };

    const calculateWinner = () => {
        const p1Wins = sets.filter(s => s.player1 > s.player2).length;
        const p2Wins = sets.filter(s => s.player2 > s.player1).length;
        if (p1Wins > p2Wins) return match.player1.id;
        if (p2Wins > p1Wins) return match.player2.id;
        return null;
    };

    const handleSubmit = async () => {
        // Validate
        const invalidSet = sets.find(s => s.player1 === s.player2);
        if (invalidSet) {
            showToast({ title: "Invalid Score", description: "Scores cannot be equal in a set", variant: "error" });
            return;
        }

        const winnerId = calculateWinner();
        if (!winnerId) {
            showToast({ title: "Invalid Result", description: "Match must have a winner", variant: "error" });
            return;
        }

        setLoading(true);
        try {
            const formattedScores = sets.map(s => `${s.player1}-${s.player2}`);

            const response = await fetch(`/api/matches/${match.id}/submit`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    set_scores: formattedScores,
                    status: "ScoreSubmitted"
                }),
            });

            if (!response.ok) throw new Error("Failed to submit score");

            showToast({ title: "Score Submitted!", description: "Waiting for confirmation.", variant: "success" });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            showToast({ title: "Error", description: "Failed to submit score", variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    const p1Name = match.player1.full_name || match.player1.email.split('@')[0];
    const p2Name = match.player2.full_name || match.player2.email.split('@')[0];
    const currentWinnerId = calculateWinner();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Submit Match Score
                    </h3>
                    <button onClick={() => onOpenChange(false)} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Score Grid */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center mb-4">
                            <div className={`text-sm font-semibold text-center truncate ${currentWinnerId === match.player1.id ? 'text-green-700' : 'text-slate-700'}`}>
                                {p1Name}
                            </div>
                            <div className="text-xs text-slate-400 font-bold">VS</div>
                            <div className={`text-sm font-semibold text-center truncate ${currentWinnerId === match.player2.id ? 'text-green-700' : 'text-slate-700'}`}>
                                {p2Name}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {sets.map((set, idx) => (
                                <div key={idx} className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                                    <input
                                        type="number"
                                        min="0"
                                        value={set.player1}
                                        onChange={(e) => handleScoreChange(idx, "player1", e.target.value)}
                                        className="text-center font-bold h-10 w-full rounded-md border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                    />
                                    <span className="text-xs font-bold text-slate-400">Set {idx + 1}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={set.player2}
                                        onChange={(e) => handleScoreChange(idx, "player2", e.target.value)}
                                        className="text-center font-bold h-10 w-full rounded-md border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center gap-2 mt-4">
                            <button
                                type="button"
                                onClick={handleAddSet}
                                disabled={sets.length >= 5}
                                className="flex items-center px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Plus className="h-3 w-3 mr-1" /> Add Set
                            </button>
                            <button
                                type="button"
                                onClick={handleRemoveSet}
                                disabled={sets.length <= 1}
                                className="flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Minus className="h-3 w-3 mr-1" /> Remove
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 bg-slate-50 border-t border-slate-200">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-70"
                    >
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {loading ? "Submitting..." : "Submit Score"}
                    </button>
                </div>
            </div>
        </div>
    );
}
