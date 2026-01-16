"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/lib/auth/auth-context";
import { ActionRequiredWidget } from "@/components/dashboard/ActionRequiredWidget";
import { UpcomingMatchesWidget } from "@/components/dashboard/UpcomingMatchesWidget";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { useDashboardData } from "@/hooks/useDashboardData";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { MyLaddersGrid } from "@/components/dashboard/my-ladders-grid";
import { PendingInvitationsCard } from "@/components/dashboard/pending-invitations";

export default function DashboardPage() {
  const { user } = useAuth();
  const { memberships, stats, isLoading } = useDashboardData();

  return (
    <ProtectedRoute>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600">
            Welcome back, {user?.firstName}! Here's what's happening.
          </p>
        </div>

        {/* Pending Invitations */}
        <PendingInvitationsCard />

        {/* Action Required Widget - Top Priority */}
        <ActionRequiredWidget />

        {/* KPI Stats Cards */}
        <KPICards stats={stats} loading={isLoading} />

        {/* Main Content Grid - Desktop: 2 columns, Mobile: 1 column */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - 2/3 width on desktop */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Ladders */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">My Ladders</h2>
              <MyLaddersGrid memberships={memberships} loading={isLoading} />
            </div>
          </div>

          {/* Right Column - 1/3 width on desktop */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upcoming Matches */}
            <UpcomingMatchesWidget />

            {/* Recent Activity */}
            <RecentActivityFeed />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
