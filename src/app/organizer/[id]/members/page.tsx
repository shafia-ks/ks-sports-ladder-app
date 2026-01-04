"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2, Trash2, Plus, Mail, ArrowLeft, CheckCircle, Clock, Settings } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface Member {
  id: string;
  user_id: string;
  status: "approved" | "pending";
  users: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

interface Organizer {
  id: string;
  user_id: string;
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

function LadderMembersPage() {
  const { user } = useAuth();
  const params = useParams() as { id: string } | null;
  const ladderId = params?.id || "";
  
  const [ladder, setLadder] = useState<Ladder | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showAddOrgForm, setShowAddOrgForm] = useState(false);
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
      const [laddersRes, membershipsRes, organizersRes] = await Promise.all([
        fetch(`/api/ladders/${ladderId}`),
        fetch(`/api/ladders/${ladderId}/members`),
        fetch(`/api/ladders/${ladderId}/organizers`),
      ]);

      if (!laddersRes.ok) throw new Error("Failed to load ladder");
      
      const laddersData = await laddersRes.json();
      setLadder(laddersData);

      if (membershipsRes.ok) {
        const membershipsData = await membershipsRes.json();
        setMembers(membershipsData.members || []);
      }

      if (organizersRes.ok) {
        const organizersData = await organizersRes.json();
        setOrganizers(organizersData.organizers || []);
      }
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
      // Check if user exists by email
      const userRes = await fetch(`/api/users/by-email?email=${encodeURIComponent(addingEmail)}`);
      if (!userRes.ok) {
        setError("User not found. Use 'Invite Members' to invite new people.");
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
      setShowAddOrgForm(false);
      setError(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add organizer");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveOrganizer = async (organizerId: string) => {
    if (!confirm("Remove this organizer?")) return;

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

  const approvedCount = members.filter(m => m.status === "approved").length;
  const pendingCount = members.filter(m => m.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/organizer" className="text-brand-600 hover:text-brand-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title={`${ladder?.name || "Ladder"} - Members`}
          description={`${approvedCount} approved • ${pendingCount} pending`}
        />
      </div>

      <div className="flex gap-2">
        <Link
          href={`/organizer/${ladderId}/rankings` as any}
          className="btn btn-primary flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Manual Rankings
        </Link>
        <Link
          href={`/organizer/${ladderId}/invite` as any}
          className="btn btn-secondary flex items-center gap-2"
        >
          <Mail className="h-4 w-4" />
          Invite Members
        </Link>
      </div>

      {error && (
        <div className="card p-4 text-sm text-red-600 bg-red-50">{error}</div>
      )}

      {loading ? (
        <div className="card p-6 text-center flex items-center justify-center gap-2 text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading members...
        </div>
      ) : (
        <>
          {/* Organizers Section */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Co-Organizers ({organizers.length})</h2>
              <button
                onClick={() => setShowAddOrgForm(!showAddOrgForm)}
                className="btn btn-primary flex items-center gap-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Co-Organizer
              </button>
            </div>

            {showAddOrgForm && (
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
                    <p className="text-xs text-slate-500 mt-1">Must be an existing user</p>
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
                      onClick={() => setShowAddOrgForm(false)}
                      className="btn btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {organizers.length === 0 ? (
              <p className="text-sm text-slate-600 py-4">No co-organizers yet.</p>
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

          {/* Members Section */}
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Ladder Members</h2>

            {members.length === 0 ? (
              <p className="text-sm text-slate-600 py-4">No members yet. Invite people to join!</p>
            ) : (
              <div className="space-y-3">
                {/* Approved Members */}
                {approvedCount > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success-600" />
                      Approved Members ({approvedCount})
                    </h3>
                    <div className="space-y-2">
                      {members
                        .filter(m => m.status === "approved")
                        .map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-3 bg-success-50 rounded-lg border border-success-100">
                            <div>
                              <p className="font-medium text-slate-900">{member.users.full_name || "—"}</p>
                              <p className="text-xs text-slate-500">{member.users.email}</p>
                            </div>
                            <span className="text-xs font-semibold text-success-700 bg-success-100 px-2 py-1 rounded">Approved</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Pending Members */}
                {pendingCount > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      Pending Approval ({pendingCount})
                    </h3>
                    <div className="space-y-2">
                      {members
                        .filter(m => m.status === "pending")
                        .map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                            <div>
                              <p className="font-medium text-slate-900">{member.users.full_name || "—"}</p>
                              <p className="text-xs text-slate-500">{member.users.email}</p>
                            </div>
                            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded">Pending</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function OrganizerMembersPage() {
  return (
    <ProtectedRoute requiredRoles={["organizer"]}>
      <LadderMembersPage />
    </ProtectedRoute>
  );
}
