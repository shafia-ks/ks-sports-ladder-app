"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2 } from "lucide-react";

interface Ladder {
  id: string;
  name: string;
  status: string;
  challenge_rules?: Record<string, unknown>;
}

interface Member {
  id: string;
  user_id: string;
  current_rank: number;
  status: string;
  hasActiveChallenge?: boolean;
  users?: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function ChallengeCreatePage() {
  const { user } = useAuth();
  const [ladders, setLadders] = useState<Ladder[]>([]);
  const [selectedLadder, setSelectedLadder] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    opponent_id: "",
    scheduledAt: new Date().toISOString().slice(0, 16),
    location: "",
    notes: "",
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
        // Fetch ladder members
        const res = await fetch(`/api/ladders/${selectedLadder}`);
        const json = await res.json();
        const activeMembers = json.members?.filter((m: Member) => m.status === "active" && m.user_id !== user?.id) ?? [];
        
        // Fetch active challenges to check busy status
        const challengesRes = await fetch(`/api/challenges?ladderId=${selectedLadder}`);
        const challengesData = await challengesRes.json();
        const activeChallenges = challengesData.challenges?.filter(
          (c: any) => c.status === "Pending" || c.status === "Accepted"
        ) || [];
        
        // Mark members with active challenges
        const membersWithStatus = activeMembers.map((m: Member) => ({
          ...m,
          hasActiveChallenge: activeChallenges.some(
            (c: any) => c.challenger_id === m.user_id || c.challenged_id === m.user_id
          ),
        }));
        
        setMembers(membersWithStatus);
      } catch (err) {
        console.error("Failed to load members", err);
      }
    };
    fetchMembers();
  }, [selectedLadder, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLadder || !formData.opponent_id) {
      alert("Please select ladder and opponent");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ladder_id: selectedLadder,
          challenger_id: user?.id,
          challenged_id: formData.opponent_id,
          status: "Pending",
          scheduled_at: formData.scheduledAt || null,
          location: formData.location || null,
          notes: formData.notes || null,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        alert(json.error || "Failed to create challenge");
        return;
      }

      alert("Challenge sent!");
      window.location.href = "/challenges";
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create challenge");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create challenge"
        description="Select ladder, opponent, and propose schedule. Validations enforced per ladder rules."
      />

      <form onSubmit={handleSubmit} className="card space-y-4 p-5">
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
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700">Opponent</label>
            <select
              value={formData.opponent_id}
              onChange={(e) => setFormData({ ...formData, opponent_id: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            >
              <option value="">Select opponent</option>
              {members.map((member) => (
                <option 
                  key={member.id} 
                  value={member.user_id}
                  disabled={member.hasActiveChallenge}
                >
                  #{member.current_rank} {member.users?.full_name || member.users?.email}
                  {member.hasActiveChallenge ? " (Busy - has active challenge)" : ""}
                </option>
              ))}
            </select>
            {formData.opponent_id && members.find(m => m.user_id === formData.opponent_id)?.hasActiveChallenge && (
              <p className="mt-1 text-xs text-amber-600">
                ⚠️ This player has an active challenge. Please wait until it's resolved.
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Scheduled time</label>
            <input
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Court location"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            rows={3}
            placeholder="Optional details or constraints"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Submit challenge"}
          </button>
          <Link className="text-sm font-semibold text-slate-600" href="/challenges">
            Cancel
          </Link>
        </div>
        <p className="text-xs text-slate-500">
          Challenge validations: rank range, busy-player checks, active cap, self-challenge prevention, expiry will auto-apply.
        </p>
      </form>
    </div>
  );
}
