"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2, ArrowLeft, ArrowUp, ArrowDown, Save, AlertCircle } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface RankingMember {
  id: string;
  user_id: string;
  current_rank: number;
  status: string;
  users: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

interface Ladder {
  id: string;
  name: string;
}

function ManualRankingsPage() {
  const { user } = useAuth();
  const params = useParams() as { id: string } | null;
  const ladderId = params?.id || "";
  
  const [ladder, setLadder] = useState<Ladder | null>(null);
  const [members, setMembers] = useState<RankingMember[]>([]);
  const [originalMembers, setOriginalMembers] = useState<RankingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (ladderId) {
      fetchData();
    }
  }, [ladderId]);

  useEffect(() => {
    // Check if rankings have changed
    const changed = members.some((member, index) => {
      const original = originalMembers.find(m => m.id === member.id);
      return original && original.current_rank !== member.current_rank;
    });
    setHasChanges(changed);
  }, [members, originalMembers]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const ladderRes = await fetch(`/api/ladders/${ladderId}`, {
        headers: { "x-user-id": user?.id || "" }
      });

      if (!ladderRes.ok) throw new Error("Failed to load ladder");
      
      const ladderData = await ladderRes.json();
      setLadder(ladderData.ladder);

      const activeMembers = (ladderData.members || [])
        .filter((m: RankingMember) => m.status === "active" && m.current_rank != null && m.current_rank >= 0)
        .sort((a: RankingMember, b: RankingMember) => (a.current_rank || 0) - (b.current_rank || 0));
      setMembers(activeMembers);
      setOriginalMembers(JSON.parse(JSON.stringify(activeMembers)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newMembers = [...members];
    [newMembers[index - 1], newMembers[index]] = [newMembers[index], newMembers[index - 1]];
    // Update ranks to match new positions
    newMembers.forEach((member, idx) => {
      member.current_rank = idx + 1;
    });
    setMembers(newMembers);
  };

  const moveDown = (index: number) => {
    if (index === members.length - 1) return;
    const newMembers = [...members];
    [newMembers[index], newMembers[index + 1]] = [newMembers[index + 1], newMembers[index]];
    // Update ranks to match new positions
    newMembers.forEach((member, idx) => {
      member.current_rank = idx + 1;
    });
    setMembers(newMembers);
  };

  const handleSave = async () => {
    if (!adjustmentReason.trim()) {
      setError("Please provide a reason for the manual ranking adjustment");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/ladders/${ladderId}/rankings/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rankings: members.map(m => ({ user_id: m.user_id, rank: m.current_rank })),
          reason: adjustmentReason,
          adjusted_by: user?.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save rankings");
      }

      setSuccess("Rankings updated successfully");
      setAdjustmentReason("");
      setOriginalMembers(JSON.parse(JSON.stringify(members)));
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rankings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setMembers(JSON.parse(JSON.stringify(originalMembers)));
    setAdjustmentReason("");
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/organizer/${ladderId}/members`} className="text-brand-600 hover:text-brand-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title={`${ladder?.name || "Ladder"} - Manual Rankings`}
          description="Adjust player rankings manually (use with caution)"
        />
      </div>

      {error && (
        <div className="card p-4 text-sm text-red-600 bg-red-50 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="card p-4 text-sm text-green-600 bg-green-50">{success}</div>
      )}

      {loading ? (
        <div className="card p-6 text-center flex items-center justify-center gap-2 text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading rankings...
        </div>
      ) : (
        <>
          <div className="card p-4 bg-amber-50 border-amber-200 text-amber-800 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Important:</strong> Manual ranking adjustments override match-based rankings. 
              Use this feature only to correct errors or handle special situations. All changes are logged in the audit trail.
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Current Rankings ({members.length})</h2>
            
            {members.length === 0 ? (
              <p className="text-sm text-slate-600 py-4">No ranked members yet.</p>
            ) : (
              <div className="space-y-2">
                {members.map((member, index) => (
                  <div 
                    key={member.id} 
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      originalMembers.find(m => m.id === member.id)?.current_rank !== member.current_rank
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-700">
                        #{member.current_rank}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{member.users.full_name || "—"}</p>
                        <p className="text-xs text-slate-500">{member.users.email}</p>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="p-2 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Move up"
                      >
                        <ArrowUp className="h-4 w-4 text-slate-700" />
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === members.length - 1}
                        className="p-2 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Move down"
                      >
                        <ArrowDown className="h-4 w-4 text-slate-700" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {hasChanges && (
            <div className="card space-y-4 p-6 border-2 border-brand-200">
              <h3 className="font-semibold text-slate-900">Save Changes</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason for Adjustment <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g., Correcting manual entry error, tournament seeding, injury adjustment..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  This reason will be logged in the audit trail for transparency.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !adjustmentReason.trim()}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Rankings
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="btn btn-secondary"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function OrganizerRankingsPage() {
  return (
    <ProtectedRoute requiredRoles={["organizer", "admin"]}>
      <ManualRankingsPage />
    </ProtectedRoute>
  );
}
