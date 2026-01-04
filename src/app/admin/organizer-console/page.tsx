"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2, ArrowLeft, Settings, Users, Mail, Plus } from "lucide-react";

interface Ladder {
  id: string;
  name: string;
  status: string;
  description?: string;
  location?: string;
}

export default function OrganizerConsolePage() {
  const { user } = useAuth();
  const [ladders, setLadders] = useState<Ladder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "organizer" && user?.role !== "admin") {
      return;
    }
    fetchMyLadders();
  }, [user]);

  const fetchMyLadders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ladders");
      if (!res.ok) throw new Error("Failed to load ladders");
      const data = await res.json();
      
      // Filter to only ladders where user is an organizer or created it
      if (user?.id) {
        const myLadders = data.ladders?.filter((ladder: any) => {
          return ladder.created_by === user.id;
        }) || [];
        setLadders(myLadders);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ladders");
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "organizer" && user?.role !== "admin") {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Only organizers and admins can access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="text-brand-600 hover:text-brand-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <PageHeader
            title="Organizer Console"
            description="Manage your ladders, organizers, and send invitations."
          />
        </div>
        <Link
          href="/ladders/create"
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Ladder
        </Link>
      </div>

      {loading && (
        <div className="card p-6 text-center text-sm text-slate-600 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your ladders...
        </div>
      )}

      {error && (
        <div className="card p-6 text-center text-sm text-red-600">{error}</div>
      )}

      {!loading && ladders.length === 0 && (
        <div className="card p-12 text-center space-y-4">
          <p className="text-slate-600">You haven't created any ladders yet.</p>
          <Link href="/ladders/create" className="btn btn-primary inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Ladder
          </Link>
        </div>
      )}

      {!loading && ladders.length > 0 && (
        <div className="grid gap-4">
          {ladders.map((ladder) => (
            <div key={ladder.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{ladder.name}</h3>
                  {ladder.description && (
                    <p className="text-sm text-slate-600 mt-1">{ladder.description}</p>
                  )}
                  {ladder.location && (
                    <p className="text-xs text-slate-500 mt-1">📍 {ladder.location}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  ladder.status === "active"
                    ? "bg-success-100 text-success-700"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {ladder.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200">
                <Link
                  href={`/ladders/${ladder.id}/settings`}
                  className="btn btn-secondary flex items-center justify-center gap-2 text-sm"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <Link
                  href={`/admin/ladders/${ladder.id}/organizers`}
                  className="btn btn-secondary flex items-center justify-center gap-2 text-sm"
                >
                  <Users className="h-4 w-4" />
                  Organizers
                </Link>
                <Link
                  href={`/admin/invite?ladder_id=${ladder.id}`}
                  className="btn btn-secondary flex items-center justify-center gap-2 text-sm col-span-2"
                >
                  <Mail className="h-4 w-4" />
                  Invite Members
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
