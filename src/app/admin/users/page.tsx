"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Loader2, UserX, UserCheck, Mail, Shield, Check, X, Clock, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  gdpr_accepted: boolean;
  sportsmanship_accepted: boolean;
}

interface PendingMembership {
  id: string;
  user_id: string;
  ladder_id: string;
  requested_at: string;
  ladders: {
    id: string;
    name: string;
  };
  users: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

export default function UsersManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pendingMemberships, setPendingMemberships] = useState<PendingMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [processingMembership, setProcessingMembership] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, membershipsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/admin/pending-memberships"),
      ]);
      
      if (!usersRes.ok) throw new Error("Failed to load users");
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);

      if (membershipsRes.ok) {
        const membershipsData = await membershipsRes.json();
        setPendingMemberships(membershipsData.memberships || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!confirm(`Change user role to ${newRole}?`)) return;
    setUpdating(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setUpdating(null);
    }
  };

  const handleMembershipApprove = async (membershipId: string) => {
    setProcessingMembership(membershipId);
    try {
      const res = await fetch(`/api/admin/pending-memberships/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "active",
          admin_id: currentUser?.id,
        }),
      });
      if (!res.ok) throw new Error("Failed to approve membership");
      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setProcessingMembership(null);
    }
  };

  const handleMembershipReject = async (membershipId: string) => {
    if (!confirm("Reject this membership request?")) return;
    setProcessingMembership(membershipId);
    try {
      const res = await fetch(`/api/admin/pending-memberships/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          admin_id: currentUser?.id,
        }),
      });
      if (!res.ok) throw new Error("Failed to reject membership");
      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setProcessingMembership(null);
    }
  };

  const roleColors: Record<string, string> = {
    admin: "bg-danger-100 text-danger-700",
    organizer: "bg-warning-100 text-warning-700",
    player: "bg-slate-100 text-slate-600",
  };

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="User management"
          description="Manage user roles, permissions, and account status."
        />

        {loading && (
          <div className="card p-5 text-center text-sm text-slate-600 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading users...
          </div>
        )}

        {error && (
          <div className="card p-5 text-center text-sm text-red-600">{error}</div>
        )}

        {/* Pending Memberships Section */}
        {!loading && pendingMemberships.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning-600" />
                Pending Ladder Memberships ({pendingMemberships.length})
              </h2>
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Ladder</th>
                      <th className="px-4 py-3">Requested</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingMemberships.map((membership) => (
                      <tr key={membership.id} className="border-t border-slate-100">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">
                              {membership.users.full_name || "—"}
                            </span>
                            <span className="text-xs text-slate-500">
                              {membership.users.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900">
                            {membership.ladders.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {new Date(membership.requested_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleMembershipApprove(membership.id)}
                              disabled={processingMembership === membership.id}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-success-100 text-success-700 text-xs font-semibold hover:bg-success-200 disabled:opacity-50"
                            >
                              {processingMembership === membership.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleMembershipReject(membership.id)}
                              disabled={processingMembership === membership.id}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-danger-100 text-danger-700 text-xs font-semibold hover:bg-danger-200 disabled:opacity-50"
                            >
                              {processingMembership === membership.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <div className="card p-5 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-800">No users found.</p>
          </div>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Compliance</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{user.full_name || "—"}</span>
                          <span className="text-xs text-slate-500">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${roleColors[user.role] || roleColors.player}`}>
                          <Shield className="h-3 w-3" />
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {user.gdpr_accepted && (
                            <span className="text-xs text-success-600" title="GDPR accepted">✓ GDPR</span>
                          )}
                          {user.sportsmanship_accepted && (
                            <span className="text-xs text-success-600" title="Sportsmanship accepted">✓ Code</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {user.id !== currentUser?.id && (
                          <div className="flex gap-2">
                            {user.role !== "admin" && (
                              <button
                                onClick={() => updateUserRole(user.id, "admin")}
                                disabled={updating === user.id}
                                className="text-xs font-semibold text-danger-600 hover:text-danger-700"
                                title="Promote to admin"
                              >
                                {updating === user.id ? "..." : "→ Admin"}
                              </button>
                            )}
                            {user.role !== "organizer" && (
                              <button
                                onClick={() => updateUserRole(user.id, "organizer")}
                                disabled={updating === user.id}
                                className="text-xs font-semibold text-warning-600 hover:text-warning-700"
                                title="Promote to organizer"
                              >
                                {updating === user.id ? "..." : "→ Organizer"}
                              </button>
                            )}
                            {user.role !== "player" && (
                              <button
                                onClick={() => updateUserRole(user.id, "player")}
                                disabled={updating === user.id}
                                className="text-xs font-semibold text-slate-600 hover:text-slate-700"
                                title="Demote to player"
                              >
                                {updating === user.id ? "..." : "→ Player"}
                              </button>
                            )}
                          </div>
                        )}
                        {user.id === currentUser?.id && (
                          <span className="text-xs text-slate-500">(You)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
