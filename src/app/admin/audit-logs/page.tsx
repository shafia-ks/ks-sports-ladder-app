"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Loader2, FileText, Filter } from "lucide-react";

interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  performed_by: string | null;
  created_at: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filter === "all" 
        ? "/api/audit-logs?limit=100"
        : `/api/audit-logs?entityType=${filter}&limit=100`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load audit logs");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const entityTypes = ["all", "ladder", "match", "challenge", "user", "membership"];

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Audit logs"
          description="Complete activity history with RBAC and compliance tracking."
        />

        <div className="card p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-600" />
            <label className="text-sm font-medium text-slate-700">Filter by entity:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {entityTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="card p-5 text-center text-sm text-slate-600 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading logs...
          </div>
        )}

        {error && (
          <div className="card p-5 text-center text-sm text-red-600">{error}</div>
        )}

        {!loading && !error && logs.length === 0 && (
          <div className="card p-5 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-800">No audit logs found.</p>
            <p className="text-sm text-slate-600">Activity will be logged automatically.</p>
          </div>
        )}

        {!loading && !error && logs.length > 0 && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Entity</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Performed By</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{log.entity_type}</span>
                          <span className="text-xs text-slate-500 font-mono">{log.entity_id.slice(0, 8)}...</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{log.action}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                        {log.performed_by ? log.performed_by.slice(0, 8) + "..." : "System"}
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
