"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { Check, X, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useRouter } from "next/navigation";

interface LadderMember {
  id: string;
  user_id: string;
  current_rank: number | null;
  status: string;
  accepted_at: string | null;
  requested_at?: string | null;
  users?: {
    id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

interface LadderData {
  ladder: {
    id: string;
    name: string;
    description: string | null;
    sport_id: string | null;
    location: string | null;
    visibility: string;
    status: string;
    challenge_rules: any;
    ranking_rules: any;
  } | null;
  members: LadderMember[];
}

export default function LadderSettingsPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<LadderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    location: "",
    visibility: "public" as "public" | "private",
    rankingType: "default-swap-minimal-drop",
    kFactor: 24,
    bonusWinStreak: 0,
    maxDrop: 1,
    maxPositionsUp: 3,
    expiryDays: 7,
    cooldownHours: 0,
  });

  const router = useRouter();

  const reload = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ladders/${params.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load ladder");
      setData(json);
      const ladder = json.ladder;
      setFormData((prev) => ({
        ...prev,
        description: ladder?.description || "",
        location: ladder?.location || "",
        visibility: ladder?.visibility || "public",
        rankingType: ladder?.ranking_rules?.type || "default-swap-minimal-drop",
        kFactor: ladder?.ranking_rules?.kFactor ?? 24,
        bonusWinStreak: ladder?.ranking_rules?.bonusWinStreak ?? 0,
        maxDrop: ladder?.ranking_rules?.maxDrop ?? 1,
        maxPositionsUp: ladder?.challenge_rules?.max_positions_up ?? 3,
        expiryDays: ladder?.challenge_rules?.expiry_days ?? 7,
        cooldownHours: ladder?.challenge_rules?.cooldown_hours ?? 0,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ladder");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [params.id]);

  const members = data?.members ?? [];
  const activeMembers = members.filter((m) => m.status === "active");
  const pendingMembers = members.filter((m) => m.status === "pending");

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericFields = ["kFactor", "bonusWinStreak", "maxDrop", "maxPositionsUp", "expiryDays", "cooldownHours"];
    setFormData((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? parseInt(value) : value,
    }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(null);
    setError(null);
    try {
      const payload = {
        description: formData.description,
        location: formData.location,
        visibility: formData.visibility,
        ranking_rules: {
          type: formData.rankingType,
          kFactor: formData.kFactor || undefined,
          maxDrop: formData.maxDrop || undefined,
          bonusWinStreak: formData.bonusWinStreak || undefined,
        },
        challenge_rules: {
          max_positions_up: formData.maxPositionsUp,
          expiry_days: formData.expiryDays,
          cooldown_hours: formData.cooldownHours,
        },
      };

      const res = await fetch(`/api/ladders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update ladder");

      setSuccess("Settings updated");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update ladder");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMemberAction = async (memberId: string, action: "accept" | "decline" | "remove") => {
    setIsLoading(true);
    try {
      await fetch(`/api/ladders/${params.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: memberId, action }),
      });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Member update failed");
    } finally {
      setIsLoading(false);
    }
  };

  const ladderName = data?.ladder?.name ?? "Ladder";

  return (
    <ProtectedRoute requiredRoles={["organizer", "admin"]}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/ladders" className="text-brand-600 hover:text-brand-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{ladderName}</h1>
            <p className="text-slate-600">Manage members and ladder settings</p>
          </div>
        </div>

        {isLoading && (
          <div className="card p-4 text-sm text-slate-600 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        )}

        {error && (
          <div className="card p-4 text-sm text-red-600">{error}</div>
        )}

        {!isLoading && !error && (
          <>
            <form onSubmit={handleSave} className="card space-y-6 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Ladder Settings</h2>
                <div className="flex gap-2 text-sm text-slate-600">
                  {success && <span className="text-success-700">{success}</span>}
                  {isSaving && (
                    <span className="flex items-center gap-1 text-slate-600">
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="location">
                    Location
                  </label>
                  <input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="visibility">
                    Visibility
                  </label>
                  <select
                    id="visibility"
                    name="visibility"
                    value={formData.visibility}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-base font-semibold text-slate-900">Ranking Rules</h3>
                <div className="space-y-3 pt-2">
                  <label className="block text-sm font-medium text-slate-700">Ranking System</label>
                  <div className="grid gap-2 md:grid-cols-2">
                    {[
                      { id: "swap-positions", label: "Swap Positions" },
                      { id: "default-swap-minimal-drop", label: "Default Swap (Minimal Drop)" },
                      { id: "slide-shift", label: "Slide Shift" },
                      { id: "points-elo", label: "Points/ELO" },
                    ].map((type) => (
                      <label key={type.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                        <input
                          type="radio"
                          name="rankingType"
                          value={type.id}
                          checked={formData.rankingType === type.id}
                          onChange={handleChange}
                        />
                        <span className="text-sm font-medium text-slate-900">{type.label}</span>
                      </label>
                    ))}
                  </div>

                  {formData.rankingType === "points-elo" && (
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <label htmlFor="kFactor" className="block text-sm font-medium text-slate-700">
                          K-Factor
                        </label>
                        <input
                          id="kFactor"
                          name="kFactor"
                          type="number"
                          min="8"
                          max="64"
                          value={formData.kFactor}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="bonusWinStreak" className="block text-sm font-medium text-slate-700">
                          Bonus Win Streak
                        </label>
                        <input
                          id="bonusWinStreak"
                          name="bonusWinStreak"
                          type="number"
                          min="0"
                          max="5"
                          value={formData.bonusWinStreak}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                    </div>
                  )}

                  {formData.rankingType === "default-swap-minimal-drop" && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="maxDrop" className="block text-sm font-medium text-slate-700">
                          Max Drop
                        </label>
                        <input
                          id="maxDrop"
                          name="maxDrop"
                          type="number"
                          min="1"
                          max="10"
                          value={formData.maxDrop}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-base font-semibold text-slate-900">Challenge Rules</h3>
                <div className="grid gap-4 md:grid-cols-3 pt-2">
                  <div className="space-y-2">
                    <label htmlFor="maxPositionsUp" className="block text-sm font-medium text-slate-700">
                      Max Positions Up
                    </label>
                    <input
                      id="maxPositionsUp"
                      name="maxPositionsUp"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.maxPositionsUp}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="expiryDays" className="block text-sm font-medium text-slate-700">
                      Challenge Expiry (days)
                    </label>
                    <input
                      id="expiryDays"
                      name="expiryDays"
                      type="number"
                      min="1"
                      max="30"
                      value={formData.expiryDays}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="cooldownHours" className="block text-sm font-medium text-slate-700">
                      Cooldown (hours)
                    </label>
                    <input
                      id="cooldownHours"
                      name="cooldownHours"
                      type="number"
                      min="0"
                      max="168"
                      value={formData.cooldownHours}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Settings"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => router.refresh()} disabled={isSaving}>
                  Reset
                </button>
              </div>
            </form>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="card p-4">
                <p className="text-sm text-slate-600">Active Members</p>
                <p className="text-2xl font-bold text-slate-900">{activeMembers.length}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-slate-600">Pending Requests</p>
                <p className="text-2xl font-bold text-slate-900">{pendingMembers.length}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-slate-600">Visibility</p>
                <Badge variant="neutral">{data?.ladder?.visibility || "public"}</Badge>
              </div>
            </div>

            {pendingMembers.length > 0 && (
              <div className="card space-y-4 p-5">
                <h2 className="text-lg font-semibold text-slate-900">Pending Join Requests</h2>
                <div className="space-y-3">
                  {pendingMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 p-4"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {member.users?.full_name || `${member.users?.first_name ?? ""} ${member.users?.last_name ?? ""}`.trim() || "Member"}
                        </p>
                        <p className="text-xs text-slate-500">{member.users?.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMemberAction(member.id, "accept")}
                          className="rounded-lg bg-success-100 p-2 hover:bg-success-200"
                        >
                          <Check className="h-4 w-4 text-success-700" />
                        </button>
                        <button
                          onClick={() => handleMemberAction(member.id, "decline")}
                          className="rounded-lg bg-danger-100 p-2 hover:bg-danger-200"
                        >
                          <X className="h-4 w-4 text-danger-700" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card space-y-4 p-5">
              <h2 className="text-lg font-semibold text-slate-900">Members ({activeMembers.length})</h2>
              {activeMembers.length === 0 ? (
                <p className="text-sm text-slate-600">No active members yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-2 text-left font-medium text-slate-700">Rank</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">Player</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">Status</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeMembers.map((member) => (
                        <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-900">#{member.current_rank ?? "-"}</td>
                          <td className="px-4 py-3">
                            <div>
                              <div className="flex items-center gap-3">
                                <Avatar
                                  name={member.users?.full_name || `${member.users?.first_name ?? ""} ${member.users?.last_name ?? ""}`}
                                  email={member.users?.email}
                                  size="sm"
                                  src={undefined}
                                />
                                <div>
                                  <p className="font-medium text-slate-900">
                                    {member.users?.full_name || `${member.users?.first_name ?? ""} ${member.users?.last_name ?? ""}`.trim() || "Member"}
                                  </p>
                                  <p className="text-xs text-slate-500">{member.users?.email}</p>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status="Active" type="match" />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleMemberAction(member.id, "remove")}
                              className="rounded-lg p-2 hover:bg-danger-100"
                              title="Remove member"
                            >
                              <Trash2 className="h-4 w-4 text-danger-600" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
