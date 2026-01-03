"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Loader2, Users, Settings, Eye, EyeOff } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

interface Ladder {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  status: string;
  visibility: string;
  sport_id: string | null;
  created_at: string;
}

export default function AdminLaddersPage() {
  const [ladders, setLadders] = useState<Ladder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLadders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ladders");
      if (!res.ok) throw new Error("Failed to load ladders");
      const data = await res.json();
      setLadders(data.ladders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ladders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLadders();
  }, []);

  return (
    <ProtectedRoute requiredRoles={["admin", "organizer"]}>
      <div className="space-y-6">
        <PageHeader
          title="Ladder management"
          description="Configure rules, ranking modes, challenge limits, and visibility for all ladders."
          cta={
            <Link href="/ladders/create" className="btn btn-primary">
              Create Ladder
            </Link>
          }
        />

        {loading && (
          <div className="card p-5 text-center text-sm text-slate-600 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading ladders...
          </div>
        )}

        {error && (
          <div className="card p-5 text-center text-sm text-red-600">{error}</div>
        )}

        {!loading && !error && ladders.length === 0 && (
          <div className="card p-5 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-800">No ladders yet.</p>
            <p className="text-sm text-slate-600">Create your first ladder to get started.</p>
          </div>
        )}

        {!loading && !error && ladders.length > 0 && (
          <div className="space-y-4">
            {ladders.map((ladder) => (
              <div key={ladder.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-slate-900">{ladder.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          ladder.status === "active" ? "bg-success-100 text-success-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          {ladder.status}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                          {ladder.visibility === "public" ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          {ladder.visibility}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">{ladder.description || "No description"}</p>
                    {ladder.location && (
                      <p className="text-xs text-slate-500">📍 {ladder.location}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      Created {new Date(ladder.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/ladders/${ladder.id}`}
                      className="btn btn-secondary btn-sm flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      View
                    </Link>
                    <Link
                      href={`/ladders/${ladder.id}/settings`}
                      className="btn btn-primary btn-sm flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
