"use client";

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/lib/auth/auth-context";
import { Trophy } from "lucide-react";
import { HelpTooltip } from "@/components/ui/tooltip";

const SPORTS = ["Badminton", "Padel", "Pickleball", "Racquetball", "Squash", "Table Tennis", "Tennis"];

const RANKING_TYPES = [
  { id: "swap-positions", label: "Swap Positions", desc: "Winner moves up, loser moves down" },
  {
    id: "default-swap-minimal-drop",
    label: "Default: Swap (Minimal Drop)",
    desc: "Swap positions, minimal rank drop",
  },
  { id: "slide-shift", label: "Slide Shift", desc: "Players slide into position" },
  { id: "points-elo", label: "Points/ELO", desc: "Rating-based system" },
];

export default function CreateLadderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sport: "",
    location: "",
    image_url: "",
    visibility: "public" as "public" | "private",
    ranking: "default-swap-minimal-drop",
    maxPositionsUp: 3,
    expiryDays: 7,
    cooldownHours: 0,
    kFactor: 24,
    maxDrop: 1,
    bonusWinStreak: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if user has permission to create ladder
  useEffect(() => {
    if (user && !["organizer", "admin"].includes(user.role)) {
      setError("Only group leaders (organizers) and admins can create ladders.");
    }
  }, [user]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "maxPositionsUp"
          ? (value === "" ? null : parseInt(value, 10))
          : name === "expiryDays" || name === "cooldownHours" || name === "kFactor" ||
            name === "maxDrop" || name === "bonusWinStreak"
          ? (value === "" ? "" : parseInt(value, 10))
          : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        sport_id: formData.sport,
        location: formData.location,
        image_url: formData.image_url || null,
        visibility: formData.visibility,
        challenge_rules: {
          max_positions_up: formData.maxPositionsUp,
          expiry_days: formData.expiryDays,
          cooldown_hours: formData.cooldownHours,
        },
        ranking_rules: {
          type: formData.ranking,
          kFactor: formData.kFactor || undefined,
          maxDrop: formData.maxDrop || undefined,
          bonusWinStreak: formData.bonusWinStreak || undefined,
        },
        created_by: user.id,
      };

      const response = await fetch("/api/ladders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create ladder");
      }

      router.push("/ladders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ladder. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRoles={["organizer", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Create Ladder"
          description="Set up a new competition ladder for your group."
        />

        <div className="max-w-2xl">
          {error && (
            <div className="mb-6 rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">
              <p className="font-semibold">{error}</p>
              {error.includes("Only group leaders") && (
                <p className="mt-2">
                  <Link href="/dashboard" className="font-semibold underline">
                    Request to become a group leader →
                  </Link>
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="card space-y-6 p-6">
            {error && (
              <div className="rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>

              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Ladder Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Squash A League"
                  required
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What's this ladder about?"
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="sport" className="block text-sm font-medium text-slate-700">
                    Sport *
                  </label>
                  <select
                    id="sport"
                    name="sport"
                    value={formData.sport}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Select sport</option>
                    {SPORTS.map((sport) => (
                      <option key={sport} value={sport}>
                        {sport}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="location" className="block text-sm font-medium text-slate-700">
                    Location
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Downtown Court"
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="image_url" className="block text-sm font-medium text-slate-700">
                  Ladder Image URL (optional)
                </label>
                <input
                  id="image_url"
                  name="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <p className="text-xs text-slate-500">
                  Provide a URL to an image for your ladder (recommended: 400x400px)
                </p>
              </div>
            </div>

            {/* Ranking Rules */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Ranking Rules</h2>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  Ranking System *
                  <HelpTooltip content="Choose how rankings are calculated. Default Swap is recommended for beginners. See Help Center for detailed comparisons." />
                </label>
                {RANKING_TYPES.map((type) => (
                  <label key={type.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                    <input
                      type="radio"
                      name="ranking"
                      value={type.id}
                      checked={formData.ranking === type.id}
                      onChange={handleChange}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-slate-900">{type.label}</p>
                      <p className="text-xs text-slate-600">{type.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {formData.ranking === "points-elo" && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="kFactor" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      K-Factor
                      <HelpTooltip content="Controls rating volatility. 24 = balanced, 32 = volatile, 16 = stable." />
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
                    <label htmlFor="bonusWinStreak" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      Bonus Win Streak
                      <HelpTooltip content="Extra points for consecutive wins. 0 = no bonus." />
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

              {formData.ranking === "default-swap-minimal-drop" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="maxDrop" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      Max Drop
                      <HelpTooltip content="Maximum positions a player can drop when losing. 1 = minimal disruption." />
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

            {/* Challenge Rules */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Challenge Rules</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="maxPositionsUp" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    Max Positions Up
                    <HelpTooltip content="How many ranks above can players challenge? Leave empty for unlimited." />
                  </label>
                  <input
                    id="maxPositionsUp"
                    name="maxPositionsUp"
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={formData.maxPositionsUp ?? ""}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Leave empty for Unlimited</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="expiryDays" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    Challenge Expiry (days)
                    <HelpTooltip content="Days to respond before challenge expires. 7 days is recommended." />
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
                  <label htmlFor="cooldownHours" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    Cooldown (hours)
                    <HelpTooltip content="Time between issuing challenges. 0 = no cooldown, 24-48 hours prevents spam." />
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

            {/* Visibility */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Visibility</h2>

              <div className="space-y-2">
                <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={formData.visibility === "public"}
                    onChange={handleChange}
                  />
                  <div>
                    <p className="font-medium text-slate-900">Public</p>
                    <p className="text-xs text-slate-600">Anyone can view and request to join</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={formData.visibility === "private"}
                    onChange={handleChange}
                  />
                  <div>
                    <p className="font-medium text-slate-900">Private</p>
                    <p className="text-xs text-slate-600">Invitation only</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Link href="/ladders" className="btn btn-secondary flex-1">
                Cancel
              </Link>
              <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                {loading ? "Creating..." : "Create Ladder"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
