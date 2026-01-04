"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2, ArrowLeft, Edit2, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface Match {
  id: string;
  ladder_id: string;
  player1_id: string;
  player2_id: string;
  winner_id: string;
  set_scores: string[];
  status: string;
  played_at: string;
  created_at: string;
  player1?: { full_name: string; email: string };
  player2?: { full_name: string; email: string };
}

interface Ladder {
  id: string;
  name: string;
}

function MatchManagementPage() {
  const { user } = useAuth();
  const params = useParams() as { id: string } | null;
  const ladderId = params?.id || "";
  
  const [ladder, setLadder] = useState<Ladder | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editWinner, setEditWinner] = useState("");

  useEffect(() => {
    if (ladderId) {
      fetchData();
    }
  }, [ladderId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ladderRes, matchesRes] = await Promise.all([
        fetch(`/api/ladders/${ladderId}`),
        fetch(`/api/matches?ladder_id=${ladderId}`),
      ]);

      if (!ladderRes.ok) throw new Error("Failed to load ladder");
      
      const ladderData = await ladderRes.json();
      setLadder(ladderData);

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setMatches(matchesData.matches || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleEditMatch = async (matchId: string) => {
    if (!editReason.trim() || !editWinner) {
      setError("Please select a winner and provide a reason");
      return;
    }

    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winner_id: editWinner,
          reason: editReason,
          updated_by: user?.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update match");
      }

      setSuccess("Match updated successfully. Rankings have been recalculated.");
      setEditingMatch(null);
      setEditReason("");
      setEditWinner("");
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update match");
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!deleteReason.trim()) {
      setError("Please provide a reason for deleting this match");
      return;
    }

    if (!confirm("Are you sure you want to delete this match? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/matches/${matchId}?reason=${encodeURIComponent(deleteReason)}&deleted_by=${user?.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete match");
      }

      setSuccess("Match deleted successfully. You may need to manually adjust rankings.");
      setDeleteReason("");
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete match");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/organizer/${ladderId}/members`} className="text-brand-600 hover:text-brand-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title={`${ladder?.name || "Ladder"} - Match Management`}
          description="Edit or delete incorrect match results"
        />
      </div>

      {error && (
        <div className="card p-4 text-sm text-red-600 bg-red-50 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="card p-4 text-sm text-green-600 bg-green-50 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}

      {loading ? (
        <div className="card p-6 text-center flex items-center justify-center gap-2 text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading matches...
        </div>
      ) : (
        <>
          <div className="card p-4 bg-amber-50 border-amber-200 text-amber-800 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Caution:</strong> Editing or deleting matches affects ladder rankings. 
              All changes are logged in the audit trail. Use this feature only to correct errors.
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Match History ({matches.length})</h2>
            
            {matches.length === 0 ? (
              <p className="text-sm text-slate-600 py-4">No matches yet.</p>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => (
                  <div key={match.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-slate-900">
                            {match.player1?.full_name || "Player 1"}
                          </span>
                          <span className="text-slate-500">vs</span>
                          <span className="font-medium text-slate-900">
                            {match.player2?.full_name || "Player 2"}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600">
                          <p>Winner: <strong>{match.winner_id === match.player1_id ? match.player1?.full_name : match.player2?.full_name}</strong></p>
                          {match.set_scores && match.set_scores.length > 0 && (
                            <p>Score: {match.set_scores.join(", ")}</p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            Played: {new Date(match.played_at).toLocaleDateString()} • 
                            Status: {match.status}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingMatch(match.id === editingMatch ? null : match.id)}
                          className="p-2 rounded hover:bg-slate-100 text-slate-600"
                          title="Edit match"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt("Reason for deleting this match:");
                            if (reason) {
                              setDeleteReason(reason);
                              handleDeleteMatch(match.id);
                            }
                          }}
                          className="p-2 rounded hover:bg-red-50 text-red-600"
                          title="Delete match"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {editingMatch === match.id && (
                      <div className="border-t border-slate-200 pt-3 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Change Winner
                          </label>
                          <select
                            value={editWinner}
                            onChange={(e) => setEditWinner(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          >
                            <option value="">Select winner...</option>
                            <option value={match.player1_id}>{match.player1?.full_name}</option>
                            <option value={match.player2_id}>{match.player2?.full_name}</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Reason for Edit <span className="text-red-600">*</span>
                          </label>
                          <textarea
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                            placeholder="e.g., Incorrect winner recorded, score entry error..."
                            rows={2}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditMatch(match.id)}
                            disabled={!editWinner || !editReason.trim()}
                            className="btn btn-primary btn-sm"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => {
                              setEditingMatch(null);
                              setEditReason("");
                              setEditWinner("");
                            }}
                            className="btn btn-secondary btn-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function OrganizerMatchesPage() {
  return (
    <ProtectedRoute requiredRoles={["organizer", "admin"]}>
      <MatchManagementPage />
    </ProtectedRoute>
  );
}
