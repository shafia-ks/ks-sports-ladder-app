"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Filter } from "lucide-react";

interface AuditLog {
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    performed_by: string | null;
    created_at: string;
}

export function AdminAuditLogsTable() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const url = filter === "all"
                ? "/api/audit-logs?limit=100"
                : `/api/audit-logs?entityType=${filter}&limit=100`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to load audit logs");
            const data = await res.json();
            setLogs(data.logs || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const entityTypes = ["all", "ladder", "match", "challenge", "user", "membership"];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-slate-200 w-fit">
                <Filter className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Filter:</span>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="text-sm bg-transparent focus:outline-none text-slate-900 font-medium"
                >
                    {entityTypes.map((type) => (
                        <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center p-8 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading operations...
                </div>
            ) : logs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg">No audit logs found.</div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="max-h-[600px] overflow-y-auto">
                        <table className="min-w-full text-left text-sm relative">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3">Time</th>
                                    <th className="px-4 py-3">Entity</th>
                                    <th className="px-4 py-3">Action</th>
                                    <th className="px-4 py-3">User</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} className="border-t border-slate-100 font-mono text-xs hover:bg-slate-50">
                                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-semibold text-slate-700">{log.entity_type}</span>
                                            <span className="text-slate-400 ml-2" title={log.entity_id}>#{log.entity_id.slice(0, 6)}</span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-900">{log.action}</td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {log.performed_by ? log.performed_by.slice(0, 8) : "System"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
