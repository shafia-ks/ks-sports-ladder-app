"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/lib/auth/auth-context";
import { UpcomingMatchesWidget } from "@/components/dashboard/UpcomingMatchesWidget";
import { useDashboardData } from "@/hooks/useDashboardData";
import { MyLaddersGrid } from "@/components/dashboard/my-ladders-grid";
import { PendingInvitationsCard } from "@/components/dashboard/pending-invitations";
import { QuickChallengeWidget } from "@/components/dashboard/QuickChallengeWidget";
import { ActivityHub } from "@/components/dashboard/ActivityHubWidget";

export default function DashboardPage() {
  const { user } = useAuth();
  const { memberships, isLoading } = useDashboardData();

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Modern Header */}
        <div className="border-b border-slate-100 pb-6">
          <h1 className="text-3xl font-extrabold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Welcome back, <span className="text-brand-600 font-semibold">{user?.firstName || user?.email?.split('@')[0]}</span>!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Feed (Left) - 8 Cols */}
          <div className="lg:col-span-8 space-y-10">
            {/* 1. Quick Challenge (Climb the Ladder) */}
            <QuickChallengeWidget />

            {/* 2. Pending Invitations */}
            <PendingInvitationsCard />

            {/* 3. My Ladders List */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-6">My Ladders</h2>
              <MyLaddersGrid memberships={memberships} loading={isLoading} />
            </section>
          </div>

          {/* Sidebar / Activity Hub (Right) - 4 Cols */}
          <div className="lg:col-span-4 space-y-10">
            {/* 1. Activity Hub (Actions + Feed) */}
            <ActivityHub />

            {/* 2. Upcoming Matches */}
            <UpcomingMatchesWidget />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
