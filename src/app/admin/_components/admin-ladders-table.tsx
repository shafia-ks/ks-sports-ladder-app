"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, Filter, Settings, Eye, EyeOff, ExternalLink, Archive, CheckCircle } from "lucide-react";
import Link from "next/link";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface Ladder {
    id: string;
    name: string;
    status: string;
    visibility: string;
    created_at: string;
    member_count?: number; // Ideally API returns this, otherwise we might skip
}

export function AdminLaddersTable() {
    const [ladders, setLadders] = useState<Ladder[]>([]);
    const [filteredLadders, setFilteredLadders] = useState<Ladder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [archiving, setArchiving] = useState<string | null>(null);

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

    useEffect(() => {
        fetchLadders();
    }, []);

    const fetchLadders = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/ladders");
            if (!res.ok) throw new Error("Failed to load ladders");
            const data = await res.json();
            setLadders(data.ladders || []);
            setFilteredLadders(data.ladders || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load ladders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let result = ladders;
        if (search) {
            result = result.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));
        }
        if (statusFilter !== "all") {
            result = result.filter(l => l.status === statusFilter);
        }
        setFilteredLadders(result);
    }, [ladders, search, statusFilter]);

    const toggleLadderStatus = (ladderId: string, currentStatus: string) => {
        const newStatus = currentStatus === "archived" ? "active" : "archived";
        const action = newStatus === "archived" ? "archive" : "reactivate";

        setConfirmModal({
            isOpen: true,
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} Ladder`,
            message: `Are you sure you want to ${action} this ladder?`,
            variant: newStatus === "archived" ? "warning" : "primary",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setArchiving(ladderId);
                try {
                    const res = await fetch(`/api/ladders/${ladderId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: newStatus }),
                    });
                    if (!res.ok) throw new Error(`Failed to ${action} ladder`);
                    await fetchLadders();
                } catch (err) {
                    console.error(err);
                } finally {
                    setArchiving(null);
                }
            },
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading ladders...
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search ladders..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                </select>
            </div>

            <div className="card overflow-hidden">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="px-4 py-3">Ladder Name</th>
                            <th className="px-4 py-3">Visibility</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Created</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLadders.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500">No ladders found.</td></tr>
                        ) : (
                            filteredLadders.map(ladder => (
                                <tr key={ladder.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                                    <td className="px-4 py-3 font-medium text-slate-900">{ladder.name}</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                                            {ladder.visibility === "public" ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                            {ladder.visibility}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${ladder.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                                            }`}>
                                            {ladder.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-500">
                                        {new Date(ladder.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <Link href={`/ladders/${ladder.id}/settings`} className="inline-flex items-center text-xs font-medium text-brand-600 hover:text-brand-700">
                                                <Settings className="h-3 w-3 mr-1" /> Settings
                                            </Link>
                                            <button
                                                onClick={() => toggleLadderStatus(ladder.id, ladder.status)}
                                                disabled={!!archiving}
                                                className={`inline-flex items-center text-xs font-medium ${ladder.status === "archived"
                                                        ? "text-green-600 hover:text-green-700"
                                                        : "text-amber-600 hover:text-amber-700"
                                                    } disabled:opacity-50`}
                                            >
                                                {ladder.status === "archived" ? (
                                                    <><CheckCircle className="h-3 w-3 mr-1" /> Activate</>
                                                ) : (
                                                    <><Archive className="h-3 w-3 mr-1" /> Archive</>
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
                loading={!!archiving}
            />
        </div>
    );
}
