"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { SkeletonCard } from "@/components/ui/skeleton-card";

interface Ladder {
  id: string;
  name: string;
  status: string;
}

interface Member {
  id: string;
  user_id: string;
  current_rank: number;
  status: string;
  users?: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function MatchSubmitPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [ladders, setLadders] = useState<Ladder[]>([]);
  const [selectedLadder, setSelectedLadder] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    player1_id: "",
    player2_id: "",
    setScores: "",
    winner: "player1",
    playedAt: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    const fetchLadders = async () => {
      try {
        const res = await fetch("/api/ladders");
        const json = await res.json();
        setLadders(json.ladders ?? []);
        if (json.ladders?.length > 0) {
          setSelectedLadder(json.ladders[0].id);
        }
      } catch (err) {
        console.error("Failed to load ladders", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLadders();
  }, []);

  useEffect(() => {
    if (!selectedLadder) return;
    const fetchMembers = async () => {
      try {
        const res = await fetch(`/api/ladders/${selectedLadder}`);
        const json = await res.json();
        setMembers(json.members?.filter((m: Member) => m.status === "active") ?? []);
      } catch (err) {
        console.error("Failed to load members", err);
      }
    };
    fetchMembers();
  }, [selectedLadder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLadder || !formData.player1_id || !formData.player2_id) {
      toast.push({
        title: "Validation Error",
        description: "Please select a ladder and both players.",
        variant: "error"
      });
      return;
    }

    setSubmitting(true);
    try {
      const scores = formData.setScores.split(",").map((s) => {
        const [p1, p2] = s.trim().split("-").map(Number);
        return { player1: p1, player2: p2 };
      });

      // Build ranking from current members
      const ranking = members
        .filter((m) => m.status === "active")
        .map((m) => ({
          userId: m.user_id,
          currentRank: m.current_rank,
        }));

      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ladderId: selectedLadder,
          player1Id: formData.player1_id,
          player2Id: formData.player2_id,
          winnerId: formData.winner === "player1" ? formData.player1_id : formData.player2_id,
          loserId: formData.winner === "player1" ? formData.player2_id : formData.player1_id,
          setScores: scores,
          playedAt: formData.playedAt,
          ruleType: "default-swap-minimal-drop",
          ranking,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        toast.push({
          title: "Submission Failed",
          description: json.error || "Failed to submit match",
          variant: "error"
        });
        return;
      }

      toast.push({
        title: "Match Submitted",
        description: "Your result has been recorded and is pending confirmation.",
        variant: "success"
      });
      window.location.href = "/matches";
    } catch (err) {
      toast.push({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to submit match",
        variant: "error"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-2" />
        <SkeletonCard rows={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submit match"
        description="Record scores with per-set input; opponent will be asked to confirm."
      />

      <form onSubmit={handleSubmit} className="card space-y-4 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700">Ladder</label>
            <select
              value={selectedLadder}
              onChange={(e) => setSelectedLadder(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            >
              <option value="">Select ladder</option>
              {ladders.map((ladder) => (
                <option key={ladder.id} value={ladder.id}>
                  {ladder.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Challenge (optional)</label>
            <select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option>None</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700">Player 1</label>
            <select
              value={formData.player1_id}
              onChange={(e) => setFormData({ ...formData, player1_id: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            >
              <option value="">Select player</option>
              {members.map((member) => (
                <option key={member.id} value={member.user_id}>
                  #{member.current_rank} {member.users?.full_name || member.users?.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Player 2</label>
            <select
              value={formData.player2_id}
              onChange={(e) => setFormData({ ...formData, player2_id: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            >
              <option value="">Select player</option>
              {members.map((member) => (
                <option key={member.id} value={member.user_id}>
                  #{member.current_rank} {member.users?.full_name || member.users?.email}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Set scores</label>
          <input
            type="text"
            value={formData.setScores}
            onChange={(e) => setFormData({ ...formData, setScores: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="e.g., 11-8, 9-11, 11-7"
            required
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700">Winner</label>
            <select
              value={formData.winner}
              onChange={(e) => setFormData({ ...formData, winner: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="player1">Player 1</option>
              <option value="player2">Player 2</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Played at</label>
            <input
              type="datetime-local"
              value={formData.playedAt}
              onChange={(e) => setFormData({ ...formData, playedAt: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit result"}
          </button>
          <Link className="text-sm font-semibold text-slate-600" href="/matches">
            Cancel
          </Link>
        </div>
        <p className="text-xs text-slate-500">
          Confirmation will trigger ranking recalculation (swap/minimal-drop/slide) and audit logging.
        </p>
      </form>
    </div>
  );
}
