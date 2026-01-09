"use client";

import { useEffect, useState } from "react";
import { Loader2, UserX, UserCheck, Shield, Check, X, Search, Filter } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface User {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    created_at: string;
    gdpr_accepted: boolean;
    sportsmanship_accepted: boolean;
    disabled?: boolean;
}

export function AdminUsersTable() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);
    const [disabling, setDisabling] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    // Modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: "danger" | "warning" | "primary";
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
    });

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/users");
            if (!res.ok) throw new Error("Failed to load users");
            const data = await res.json();
            setUsers(data.users || []);
            setFilteredUsers(data.users || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        let result = users;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(u =>
                (u.email.toLowerCase().includes(q)) ||
                (u.full_name?.toLowerCase().includes(q))
            );
        }
        if (roleFilter !== "all") {
            result = result.filter(u => u.role === roleFilter);
        }
        setFilteredUsers(result);
    }, [users, search, roleFilter]);

    const updateUserRole = (userId: string, newRole: string) => {
        setConfirmModal({
            isOpen: true,
            title: "Change User Role",
            message: `Are you sure you want to change this user's role to ${newRole}?`,
            variant: "primary",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
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
                    setError(err instanceof Error ? err.message : "Failed to update");
                } finally {
                    setUpdating(null);
                }
            },
        });
    };

    const disableUser = (userId: string) => {
        setConfirmModal({
            isOpen: true,
            title: "Disable User",
            message: "This user won't be able to sign in. Are you sure?",
            variant: "danger",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setDisabling(userId);
                try {
                    const res = await fetch(`/api/users/${userId}/disable`, { method: "PATCH" });
                    if (!res.ok) throw new Error("Failed to disable user");
                    await fetchUsers();
                } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to disable user");
                } finally {
                    setDisabling(null);
                }
            },
        });
    };

    const roleColors: Record<string, string> = {
        admin: "bg-red-100 text-red-700",
        organizer: "bg-amber-100 text-amber-700",
        player: "bg-slate-100 text-slate-600",
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading users...
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>;
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                        <option value="all">All Roles</option>
                        <option value="player">Player</option>
                        <option value="organizer">Organizer</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Joined</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Compliance</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                        No users found matching filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50/50">
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
                                            {user.disabled ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                                                    <UserX className="h-3 w-3" /> Disabled
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.gdpr_accepted && user.sportsmanship_accepted ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                                                    <Check className="h-3 w-3" /> GDPR / Code
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                                                    <X className="h-3 w-3" /> Missing
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {user.id !== currentUser?.id && !user.disabled && (
                                                <div className="flex justify-end gap-2">
                                                    {user.role !== "admin" && (
                                                        <button onClick={() => updateUserRole(user.id, "admin")} disabled={!!updating} className="text-xs text-brand-600 hover:underline">Make Admin</button>
                                                    )}
                                                    {user.role !== "player" && (
                                                        <button onClick={() => updateUserRole(user.id, "player")} disabled={!!updating} className="text-xs text-slate-600 hover:underline">Demote</button>
                                                    )}
                                                    <button onClick={() => disableUser(user.id)} disabled={!!disabling} className="text-xs text-red-600 hover:underline">Disable</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
                loading={!!updating || !!disabling}
            />
        </div>
    );
}
