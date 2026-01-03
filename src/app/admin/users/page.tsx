"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Loader2, UserX, UserCheck, Mail, Shield } from "lucide-react";
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

export default function UsersManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.users || []);
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
