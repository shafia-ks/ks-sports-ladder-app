"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Loader2, Calendar, Archive, Plus, X } from "lucide-react";

interface Season {
  id: string;
  ladder_id: string;
  name: string;
  start_date: string;
  end_date: string;
  archived: boolean;
  created_at: string;
  ladders?: { name: string };
}

interface Ladder {
  id: string;
  name: string;
}

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [ladders, setLadders] = useState<Ladder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    ladderId: "",
    name: "",
    startDate: "",
    endDate: "",
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [seasonsRes, laddersRes] = await Promise.all([
        fetch("/api/seasons"),
        fetch("/api/ladders"),
      ]);
      
      if (!seasonsRes.ok || !laddersRes.ok) throw new Error("Failed to load data");
      
      const [seasonsData, laddersData] = await Promise.all([
        seasonsRes.json(),
        laddersRes.json(),
      ]);
      
      setSeasons(seasonsData.seasons || []);
      setLadders(laddersData.ladders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/seasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ladder_id: formData.ladderId,
          name: formData.name,
          start_date: formData.startDate,
          end_date: formData.endDate,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to create season");
      
      setShowCreate(false);
      setFormData({ ladderId: "", name: "", startDate: "", endDate: "" });
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create season");
    }
  };

  const handleArchive = async (seasonId: string) => {
    if (!confirm("Archive this season? This will preserve rankings and cannot be undone.")) return;
    try {
      const res = await fetch(`/api/seasons/${seasonId}/archive`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to archive season");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to archive");
    }
  };

  return (
    <ProtectedRoute requiredRoles={["admin", "organizer"]}>
      <div className="space-y-6">
        <PageHeader
          title="Season management"
          description="Start, close, and archive ladder seasons with ranking snapshots."
          cta={
            <button onClick={() => setShowCreate(true)} className="btn btn-primary flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Season
            </button>
          }
        />

        {showCreate && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">New Season</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ladder</label>
                <select
                  value={formData.ladderId}
                  onChange={(e) => setFormData({ ...formData, ladderId: e.target.value })}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Select ladder...</option>
                  {ladders.map((ladder) => (
                    <option key={ladder.id} value={ladder.id}>{ladder.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Season Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Winter 2026"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Season
                </button>
              </div>
            </form>
          </div>
        )}

        {loading && (
          <div className="card p-5 text-center text-sm text-slate-600 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading seasons...
          </div>
        )}

        {error && (
          <div className="card p-5 text-center text-sm text-red-600">{error}</div>
        )}

        {!loading && !error && seasons.length === 0 && !showCreate && (
          <div className="card p-5 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-800">No seasons configured.</p>
            <p className="text-sm text-slate-600">Create a season to track performance over time.</p>
          </div>
        )}

        {!loading && !error && seasons.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Active Seasons</h3>
            {seasons.filter(s => !s.archived).map((season) => (
              <div key={season.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-slate-900">{season.name}</h4>
                    <p className="text-sm text-slate-600">{season.ladders?.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(season.start_date).toLocaleDateString()} - {new Date(season.end_date).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleArchive(season.id)}
                    className="btn btn-secondary btn-sm flex items-center gap-2"
                  >
                    <Archive className="h-4 w-4" />
                    Archive
                  </button>
                </div>
              </div>
            ))}

            {seasons.filter(s => s.archived).length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-slate-700 mt-6">Archived Seasons</h3>
                {seasons.filter(s => s.archived).map((season) => (
                  <div key={season.id} className="card p-5 bg-slate-50">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-700">{season.name}</h4>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                            <Archive className="h-3 w-3" />
                            Archived
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{season.ladders?.name}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(season.start_date).toLocaleDateString()} - {new Date(season.end_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
