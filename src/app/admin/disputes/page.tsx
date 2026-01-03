"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/lib/auth/auth-context";
import { AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

interface DisputedMatch {
  id: string;
  ladder_id: string;
  player1_id: string;
  player2_id: string;
  winner_id: string | null;
  set_scores: any;
  status: string;
  disputed_by: string;
  played_at: string;
  created_at: string;
  player1?: { full_name: string; email: string };
  player2?: { full_name: string; email: string };
  ladders?: { name: string };
}

export default function DisputesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<DisputedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  const fetchDisputes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/matches?status=Disputed");
      if (!res.ok) throw new Error("Failed to load disputes");
      const data = await res.json();
      setMatches(data.matches || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const resolveDispute = async (matchId: string, action: "confirm" | "reject") => {
    if (!user) return;
    setResolving(matchId);
    try {
      const endpoint = action === "confirm" 
        ? `/api/matches/${matchId}?action=confirm`
        : `/api/matches/${matchId}?action=reject`;
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, userId: user.id }),
      });
      
      if (!res.ok) throw new Error("Failed to resolve dispute");
      await fetchDisputes();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to resolve");
    } finally {
      setResolving(null);
    }
  };

  return (
    <ProtectedRoute requiredRoles={["admin", "organizer"]}>
      <div className="space-y-6">
        <PageHeader
          title="Dispute resolution"
          description="Review contested matches, confirm outcomes, and log decisions."
        />

        {loading && (
          <div className="card p-5 text-center text-sm text-slate-600 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading disputes...
          </div>
        )}

        {error && (
          <div className="card p-5 text-center text-sm text-red-600">{error}</div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div className="card p-5 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-800">No disputes yet.</p>
            <p className="text-sm text-slate-600">Match disputes will appear here for resolution.</p>
          </div>
        )}

        {!loading && !error && matches.length > 0 && (
          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.id} className="card p-5 space-y-4 border-l-4 border-l-danger-500">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{match.ladders?.name || "Ladder"}</h3>
                      <StatusBadge status={match.status} type="match" />
                    </div>
                    <p className="text-sm text-slate-600">
                      {match.player1?.full_name} vs {match.player2?.full_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Played: {new Date(match.played_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-600">Reported Winner</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {match.winner_id === match.player1_id
                        ? match.player1?.full_name
                        : match.player2?.full_name}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Score</p>
                  <p className="text-sm text-slate-900">
                    {JSON.stringify(match.set_scores)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => resolveDispute(match.id, "confirm")}
                    disabled={resolving === match.id}
                    className="btn btn-success flex items-center gap-2 flex-1"
                  >
                    {resolving === match.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Confirm Result
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Reject this match result? This cannot be undone.")) {
                        resolveDispute(match.id, "reject");
                      }
                    }}
                    disabled={resolving === match.id}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
