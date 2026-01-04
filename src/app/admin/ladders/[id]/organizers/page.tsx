"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/lib/auth/auth-context";
import { ArrowLeft, Loader2, Trash2, Plus, Mail } from "lucide-react";

interface Organizer {
  id: string;
  user_id: string;
  created_at: string;
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

export default function LadderOrganizersPage() {
  const { user } = useAuth();
  const params = useParams() as { id: string } | null;
  const ladderId = params?.id || "";
  
  const [ladder, setLadder] = useState<Ladder | null>(null);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingEmail, setAddingEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (ladderId) {
      fetchData();
    }
  }, [ladderId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [laddersRes, organizersRes] = await Promise.all([
        fetch(`/api/ladders/${ladderId}`),
        fetch(`/api/ladders/${ladderId}/organizers`),
      ]);

      if (!laddersRes.ok || !organizersRes.ok) {
        throw new Error("Failed to load data");
      }

      const laddersData = await laddersRes.json();
      const organizersData = await organizersRes.json();

      setLadder(laddersData);
      setOrganizers(organizersData.organizers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingEmail.trim() || !user?.id) return;

    setIsAdding(true);
    try {
      // First check if user exists by email
      const userRes = await fetch(`/api/users/by-email?email=${encodeURIComponent(addingEmail)}`);
      if (!userRes.ok) {
        setError("User not found. Send them an invitation instead.");
        return;
      }

      const userData = await userRes.json();
      
      // Add as organizer
      const res = await fetch(`/api/ladders/${ladderId}/organizers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userData.user.id,
          requested_by: user.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add organizer");
      }

      setAddingEmail("");
      setShowAddForm(false);
      setError(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add organizer");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveOrganizer = async (organizerId: string) => {
    if (!confirm("Remove this organizer from the ladder?")) return;

    setDeleting(organizerId);
    try {
      const res = await fetch(`/api/ladders/${ladderId}/organizers/${organizerId}?requested_by=${user?.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove organizer");

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove organizer");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/organizer-console" className="text-brand-600 hover:text-brand-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title={`${ladder?.name || "Ladder"} - Organizers`}
          description="Manage organizers for this ladder"
        />
      </div>

      {loading && (
        <div className="card p-6 text-center flex items-center justify-center gap-2 text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      )}

      {error && (
        <div className="card p-4 text-sm text-red-600 bg-red-50">{error}</div>
      )}

      {!loading && (
        <>
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Current Organizers ({organizers.length})</h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn btn-primary flex items-center gap-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Organizer
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddOrganizer} className="border-t border-slate-200 pt-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">User Email</label>
                    <input
                      type="email"
                      value={addingEmail}
                      onChange={(e) => setAddingEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full mt-1 rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      User must already have an account. Use "Invite Members" to invite new people.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isAdding || !addingEmail.trim()}
                      className="btn btn-primary flex items-center gap-2 text-sm"
                    >
                      {isAdding && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isAdding ? "Adding..." : "Add"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="btn btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {organizers.length === 0 ? (
              <p className="text-sm text-slate-600 py-4">No organizers yet.</p>
            ) : (
              <div className="space-y-2">
                {organizers.map((org) => (
                  <div key={org.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{org.users.full_name || "—"}</p>
                      <p className="text-xs text-slate-500">{org.users.email}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveOrganizer(org.id)}
                      disabled={deleting === org.id}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {deleting === org.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href={`/admin/invite?ladder_id=${ladderId}`}
            className="btn btn-secondary flex items-center justify-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Invite Members to This Ladder
          </Link>
        </>
      )}
    </div>
  );
}
