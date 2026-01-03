"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { StatCard } from "@/components/ui/stat-card";
import { Trophy, Users, Swords, AlertCircle, TrendingUp, Calendar } from "lucide-react";

const cards = [
  {
    title: "Leader Requests",
    description: "Review and approve/reject player requests to become group leaders.",
    href: { pathname: "/admin/leader-requests" },
  },
  {
    title: "User Management",
    description: "Manage user roles, permissions, and account status.",
    href: { pathname: "/admin/users" },
  },
  {
    title: "Ladder Settings",
    description: "Configure rules, ranking modes, challenge limits, visibility.",
    href: { pathname: "/admin/ladders" },
  },
  {
    title: "Seasons",
    description: "Start/close seasons, archive standings, carry-over setup.",
    href: { pathname: "/admin/seasons" },
  },
  {
    title: "Disputes",
    description: "Resolve match disputes and confirm ranking adjustments.",
    href: { pathname: "/admin/disputes" },
  },
  {
    title: "Audit Logs",
    description: "Complete activity history with RBAC and compliance tracking.",
    href: { pathname: "/admin/audit-logs" },
  },
];

interface AdminStats {
  totalLadders: number;
  totalMembers: number;
  activeChallenges: number;
  pendingDisputes: number;
  pendingRequests: number;
  recentMatches: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalLadders: 0,
    totalMembers: 0,
    activeChallenges: 0,
    pendingDisputes: 0,
    pendingRequests: 0,
    recentMatches: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [laddersRes, matchesRes, challengesRes, requestsRes, memberCountRes] = await Promise.all([
          fetch("/api/ladders"),
          fetch("/api/matches?status=Disputed"),
          fetch("/api/challenges?status=Pending"),
          fetch("/api/leader-requests"),
          fetch("/api/admin/member-count"),
        ]);

        const [ladders, matches, challenges, requests, memberCount] = await Promise.all([
          laddersRes.json(),
          matchesRes.json(),
          challengesRes.json(),
          requestsRes.json(),
          memberCountRes.json(),
        ]);

        setStats({
          totalLadders: ladders.ladders?.length || 0,
          totalMembers: memberCount?.totalMembers || 0,
          activeChallenges: challenges.challenges?.length || 0,
          pendingDisputes: matches.matches?.length || 0,
          pendingRequests: requests.requests?.filter((r: any) => r.status === "pending").length || 0,
          recentMatches: 0,
        });
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <ProtectedRoute requiredRoles={["admin", "organizer"]}>
      <div className="space-y-6">
        <PageHeader
          title="Admin console"
          description="Manage ladders, resolve disputes, and oversee league operations."
        />

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Active Ladders"
            value={stats.totalLadders}
            icon={Trophy}
            variant="primary"
            loading={loading}
          />
          <StatCard
            title="Pending Challenges"
            value={stats.activeChallenges}
            icon={Swords}
            variant="info"
            loading={loading}
          />
          <StatCard
            title="Pending Disputes"
            value={stats.pendingDisputes}
            icon={AlertCircle}
            variant={stats.pendingDisputes > 0 ? "danger" : "neutral"}
            loading={loading}
            link="/admin/disputes"
          />
          <StatCard
            title="Role Requests"
            value={stats.pendingRequests}
            icon={TrendingUp}
            variant={stats.pendingRequests > 0 ? "warning" : "neutral"}
            loading={loading}
            link="/admin/leader-requests"
          />
          <StatCard
            title="Total Members"
            value={stats.totalMembers}
            icon={Users}
            variant="neutral"
            loading={loading}
          />
          <StatCard
            title="Recent Matches"
            value={stats.recentMatches}
            icon={Calendar}
            variant="neutral"
            loading={loading}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <Link key={card.title} href={card.href} className="card block p-4 hover:border-brand-200 transition-colors">
                <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{card.description}</p>
                <span className="mt-3 inline-block text-sm font-semibold text-brand-700">Manage →</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
