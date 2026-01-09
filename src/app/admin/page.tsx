"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { StatCard } from "@/components/ui/stat-card";
import { Trophy, Users, AlertCircle, TrendingUp, Calendar, FileText } from "lucide-react";

import { AdminUsersTable } from "./_components/admin-users-table";
import { AdminLaddersTable } from "./_components/admin-ladders-table";
import { AdminRequestsTable } from "./_components/admin-requests-table";
import { AdminDisputesTable } from "./_components/admin-disputes-table";
import { AdminAuditLogsTable } from "./_components/admin-audit-logs-table";

type ViewType = "users" | "ladders" | "requests" | "disputes" | "audit";

interface AdminStats {
  totalLadders: number;
  totalUsers: number;
  pendingDisputes: number;
  pendingRequests: number;
  recentLogs: number;
}

export default function AdminPage() {
  const [activeView, setActiveView] = useState<ViewType>("users");
  const [stats, setStats] = useState<AdminStats>({
    totalLadders: 0,
    totalUsers: 0,
    pendingDisputes: 0,
    pendingRequests: 0,
    recentLogs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [laddersRes, usersRes, disputesRes, requestsRes, logsRes] = await Promise.all([
          fetch("/api/ladders"),
          fetch("/api/users"), // Now correctly fetching Auth Users for Total count
          fetch("/api/matches?status=Disputed"),
          fetch("/api/leader-requests"),
          fetch("/api/audit-logs?limit=1"), // Just to check existence/count if possible
        ]);

        const [ladders, users, disputes, requests, logs] = await Promise.all([
          laddersRes.json(),
          usersRes.json(),
          disputesRes.json(),
          requestsRes.json(),
          logsRes.json(),
        ]);

        setStats({
          totalLadders: ladders.ladders?.length || 0,
          totalUsers: users.users?.length || 0,
          pendingDisputes: disputes.matches?.length || 0,
          pendingRequests: requests.requests?.filter((r: any) => r.status === "pending").length || 0,
          recentLogs: 0, // We rely on the view for logs detail
        });
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getActiveComponent = () => {
    switch (activeView) {
      case "users": return <AdminUsersTable />;
      case "ladders": return <AdminLaddersTable />;
      case "requests": return <AdminRequestsTable />;
      case "disputes": return <AdminDisputesTable />;
      case "audit": return <AdminAuditLogsTable />;
      default: return <AdminUsersTable />;
    }
  };

  const getHeaderTitle = () => {
    switch (activeView) {
      case "users": return "User Management";
      case "ladders": return "Ladder Management";
      case "requests": return "Organizer Requests";
      case "disputes": return "Dispute Resolution";
      case "audit": return "System Audit Logs";
      default: return "System Administration";
    }
  };

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="System Administration"
          description="Manage users, approve organizer requests, and oversee league operations."
        />

        {/* Stats Row - Acts as Navigation Tabs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div onClick={() => setActiveView("users")} className={`cursor-pointer transition-transform hover:-translate-y-1 ${activeView === 'users' ? 'ring-2 ring-brand-500 rounded-xl' : ''}`}>
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={<Users className="h-5 w-5 text-slate-600" />}
              variant="neutral"
              loading={loading}
            />
          </div>
          <div onClick={() => setActiveView("ladders")} className={`cursor-pointer transition-transform hover:-translate-y-1 ${activeView === 'ladders' ? 'ring-2 ring-blue-500 rounded-xl' : ''}`}>
            <StatCard
              title="Active Ladders"
              value={stats.totalLadders}
              icon={<Trophy className="h-5 w-5 text-blue-600" />}
              variant="primary"
              loading={loading}
            />
          </div>
          <div onClick={() => setActiveView("requests")} className={`cursor-pointer transition-transform hover:-translate-y-1 ${activeView === 'requests' ? 'ring-2 ring-amber-500 rounded-xl' : ''}`}>
            <StatCard
              title="Requests"
              value={stats.pendingRequests}
              icon={<TrendingUp className="h-5 w-5 text-amber-600" />}
              variant={stats.pendingRequests > 0 ? "warning" : "neutral"}
              loading={loading}
            />
          </div>
          <div onClick={() => setActiveView("disputes")} className={`cursor-pointer transition-transform hover:-translate-y-1 ${activeView === 'disputes' ? 'ring-2 ring-red-500 rounded-xl' : ''}`}>
            <StatCard
              title="Disputes"
              value={stats.pendingDisputes}
              icon={<AlertCircle className="h-5 w-5 text-red-600" />}
              variant={stats.pendingDisputes > 0 ? "danger" : "neutral"}
              loading={loading}
            />
          </div>
          <div onClick={() => setActiveView("audit")} className={`cursor-pointer transition-transform hover:-translate-y-1 ${activeView === 'audit' ? 'ring-2 ring-slate-400 rounded-xl' : ''}`}>
            <StatCard
              title="Audit Logs"
              value="View"
              icon={<FileText className="h-5 w-5 text-slate-500" />}
              variant="neutral"
              loading={loading}
            />
          </div>
        </div>

        {/* Dynamic Content Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 border-b border-slate-200 pb-2">
            {getHeaderTitle()}
          </h2>
          {getActiveComponent()}
        </div>
      </div>
    </ProtectedRoute>
  );
}
