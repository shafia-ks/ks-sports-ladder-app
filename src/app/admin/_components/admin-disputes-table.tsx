"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

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
    player1?: { full_name: string; email: string };
    player2?: { full_name: string; email: string };
    ladders?: { name: string };
}

export function AdminDisputesTable() {
    const { user } = useAuth();
    const [matches, setMatches] = useState<DisputedMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState<string | null>(null);

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/matches?status=Disputed");
            if (!res.ok) throw new Error("Failed to load disputes");
            const data = await res.json();
            setMatches(data.matches || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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

    if (loading) return <div className="p-8 text-center text-slate-500"><Loader2 className="h-6 w-6 animate-spin inline mr-2" /> Loading disputes...</div>;

    if (matches.length === 0) return <div className="p-8 text-center text-slate-500">No pending disputes.</div>;

    return (
        <div className="space-y-4">
            {matches.map((match) => (
                <div key={match.id} className="card p-5 space-y-4 border-l-4 border-l-red-500">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-slate-900">{match.ladders?.name || "Ladder"}</h3>
                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">Disputed</span>
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
                        <p className="text-sm text-slate-900 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(match.set_scores)}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => resolveDispute(match.id, "confirm")}
                            disabled={resolving === match.id}
                            className="btn btn-sm btn-success flex items-center gap-2 flex-1 justify-center"
                        >
                            {resolving === match.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                            Confirm Result
                        </button>
                        <button
                            onClick={() => {
                                if (confirm("Reject this match result? This cannot be undone.")) {
                                    resolveDispute(match.id, "reject");
                                }
                            }}
                            disabled={resolving === match.id}
                            className="btn btn-sm btn-secondary flex items-center gap-2 flex-1 justify-center"
                        >
                            <XCircle className="h-4 w-4" />
                            Reject
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
