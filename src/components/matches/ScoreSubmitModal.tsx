"use client";

import { useState, useEffect } from "react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Plus, Minus } from "lucide-react";

interface ScoreSubmitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { setScores: string[], winnerId: string }) => void;
    player1Name: string;
    player2Name: string;
    player1Id: string;
    player2Id: string;
    loading?: boolean;
}

export function ScoreSubmitModal({
    isOpen,
    onClose,
    onSubmit,
    player1Name,
    player2Name,
    player1Id,
    player2Id,
    loading = false
}: ScoreSubmitModalProps) {
    const [sets, setSets] = useState<Array<{ p1: number | "", p2: number | "" }>>([
        { p1: "", p2: "" },
        { p1: "", p2: "" },
        { p1: "", p2: "" },
    ]);

    useEffect(() => {
        if (isOpen) {
            setSets([{ p1: "", p2: "" }, { p1: "", p2: "" }, { p1: "", p2: "" }]);
        }
    }, [isOpen]);

    const filledSets = sets.filter((s) => s.p1 !== "" && s.p2 !== "");
    const hasTiedSet = filledSets.some((s) => s.p1 === s.p2);

    const updateSet = (index: number, player: "p1" | "p2", value: string) => {
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

    const addSet = () => {
        if (sets.length < 5) setSets([...sets, { p1: "", p2: "" }]);
    };

    const removeSet = () => {
        if (sets.length > 1) setSets(sets.slice(0, -1));
    };

    const calculateWinner = () => {
        if (hasTiedSet) return null;
        let p1Wins = 0;
        let p2Wins = 0;
        filledSets.forEach((s) => {
            if ((s.p1 as number) > (s.p2 as number)) p1Wins++;
            if ((s.p2 as number) > (s.p1 as number)) p2Wins++;
        });
        if (p1Wins > p2Wins) return player1Id;
        if (p2Wins > p1Wins) return player2Id;
        return null;
    };

    const handleSubmit = () => {
        const winnerId = calculateWinner();
        if (!winnerId) return;
        const formattedScores = filledSets.map(s => `${s.p1}-${s.p2}`);
        onSubmit({ setScores: formattedScores, winnerId });
    };

    const winnerId = calculateWinner();

    const scoreContent = (
        <div className="space-y-4">
            <div className="flex justify-between items-center text-sm font-medium text-slate-500 px-8">
                <span className="w-24 truncate text-center">{player1Name}</span>
                <span>vs</span>
                <span className="w-24 truncate text-center">{player2Name}</span>
            </div>

            {sets.map((set, idx) => (
                <div key={idx} className="flex items-center gap-2 justify-center">
                    <span className="text-xs text-slate-400 w-4 font-mono">{idx + 1}</span>
                    <input
                        type="number"
                        min="0"
                        value={set.p1}
                        onChange={(e) => updateSet(idx, "p1", e.target.value)}
                        className={`w-16 h-10 text-center border rounded-md focus:ring-2 focus:ring-brand-500 ${
                            set.p1 !== "" && set.p2 !== "" && set.p1 === set.p2
                                ? "border-red-400 bg-red-50"
                                : "border-slate-300"
                        }`}
                        placeholder="0"
                    />
                    <span className="text-slate-300">-</span>
                    <input
                        type="number"
                        min="0"
                        value={set.p2}
                        onChange={(e) => updateSet(idx, "p2", e.target.value)}
                        className={`w-16 h-10 text-center border rounded-md focus:ring-2 focus:ring-brand-500 ${
                            set.p1 !== "" && set.p2 !== "" && set.p1 === set.p2
                                ? "border-red-400 bg-red-50"
                                : "border-slate-300"
                        }`}
                        placeholder="0"
                    />
                </div>
            ))}

            <div className="flex justify-center gap-2 mt-2">
                {sets.length < 5 && (
                    <button
                        onClick={addSet}
                        className="px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 rounded flex items-center"
                    >
                        <Plus className="h-3 w-3 mr-1" /> Add Set
                    </button>
                )}
                {sets.length > 1 && (
                    <button
                        onClick={removeSet}
                        className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded flex items-center"
                    >
                        <Minus className="h-3 w-3 mr-1" /> Remove
                    </button>
                )}
            </div>
        </div>
    );

    const messageWithTieWarning = (
        <div>
            {scoreContent}
            {hasTiedSet && (
                <p className="text-xs text-red-600 text-center mt-4">
                    A set cannot end in a tie. Please correct the highlighted scores.
                </p>
            )}
        </div>
    );

    return (
        <ConfirmModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={handleSubmit}
            title="Submit Match Score"
            message={messageWithTieWarning}
            confirmText={loading ? "Submitting..." : "Submit Score"}
            loading={loading}
            confirmDisabled={!winnerId || hasTiedSet || loading}
        />
    );
}
