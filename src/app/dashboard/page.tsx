"use client";

import { useDashboardData } from "@/hooks/useDashboardData";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { PendingActions } from "@/components/dashboard/pending-actions";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { MyLaddersGrid } from "@/components/dashboard/my-ladders-grid";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PageHeader } from "@/components/ui/page-header";

export default function DashboardPage() {
  const { user, memberships, challenges, matches, stats, isLoading } = useDashboardData();

  const activeChallenges = challenges.filter(
    (c: any) => c.status === "pending" || c.status === "scheduled"
  ).map((c: any) => ({
    id: c.id,
    opponentName: c.challenger_id === user?.id ? c.challenged?.full_name : c.challenger?.full_name,
    ladderName: "Ladder", // TODO: Need ladder name join in API or enrichment
    scheduledFor: c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : null,
    status: c.status,
    isChallenger: c.challenger_id === user?.id,
    ...c
  }));

  const recentMatches = matches.filter(
    (m: any) => m.status === "Confirmed"
  ).slice(0, 5).map((m: any) => ({
    id: m.id,
    winnerId: m.winner_id,
    opponentName: m.player1_id === user?.id ? m.player2?.full_name : m.player1?.full_name, // API enrichment needed
    ladderName: "Ladder", // API enrichment needed
    score: m.set_scores?.join(", "),
    ...m
  }));

  return (
    <ProtectedRoute>
      <div className="space-y-6 pb-20">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600">
            Welcome back, {user?.firstName}! Here's what's happening.
          </p>
        </div>

        {/* Row 1: KPIs */}
        <KPICards stats={stats} loading={isLoading} />

        {/* Row 2: Pending Actions (Priority) */}
        {!isLoading && (
          <PendingActions
            challenges={activeChallenges}
            matches={matches}
            loading={isLoading}
          />
        )}

        {/* Row 3: Main Grid */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">My Ladders</h2>
            <MyLaddersGrid memberships={memberships} loading={isLoading} />
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Activity Feed</h2>
            <ActivityFeed
              activeChallenges={activeChallenges}
              recentMatches={recentMatches}
              loading={isLoading}
              userId={user?.id || ""}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
