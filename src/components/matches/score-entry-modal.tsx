"use client";

import { useState } from "react";

interface SetScore {
  set: number;
  player1_score: number;
  player2_score: number;
}

interface ScoreEntryModalProps {
  matchId: string;
  player1Name: string;
  player2Name: string;
  onClose: () => void;
  onSubmit: (sets: SetScore[]) => Promise<void>;
}

export function ScoreEntryModal({
  matchId,
  player1Name,
  player2Name,
  onClose,
  onSubmit,
}: ScoreEntryModalProps) {
  const [sets, setSets] = useState<SetScore[]>([
    { set: 1, player1_score: 0, player2_score: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const addSet = () => {
    setSets([...sets, { set: sets.length + 1, player1_score: 0, player2_score: 0 }]);
  };

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index).map((s, i) => ({ ...s, set: i + 1 })));
    }
  };

  const updateSet = (index: number, field: "player1_score" | "player2_score", value: number) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    setSets(newSets);
  };

  const handleSubmit = async () => {
    // Validation
    const hasInvalidScores = sets.some(
      (s) => s.player1_score < 0 || s.player2_score < 0
    );
    if (hasInvalidScores) {
      setError("Scores must be non-negative");
      return;
    }

    const hasNoWinner = sets.every((s) => s.player1_score === s.player2_score);
    if (hasNoWinner) {
      setError("At least one set must have a winner");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit(sets);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit scores");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Submit Match Score</h2>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm font-semibold mb-2">
            <span>{player1Name}</span>
            <span>{player2Name}</span>
          </div>
        </div>

        <div className="space-y-3">
          {sets.map((set, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm font-medium w-12">Set {set.set}</span>
              <input
                type="number"
                min="0"
                value={set.player1_score}
                onChange={(e) => updateSet(index, "player1_score", parseInt(e.target.value) || 0)}
                className="border rounded px-3 py-2 w-20 text-center"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                min="0"
                value={set.player2_score}
                onChange={(e) => updateSet(index, "player2_score", parseInt(e.target.value) || 0)}
                className="border rounded px-3 py-2 w-20 text-center"
              />
              {sets.length > 1 && (
                <button
                  onClick={() => removeSet(index)}
                  className="text-red-500 hover:text-red-700 text-sm ml-2"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addSet}
          className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          + Add Set
        </button>

        {error && (
          <div className="mt-4 p-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Score"}
          </button>
        </div>
      </div>
    </div>
  );
}
