import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Swords, TrendingUp, Calendar, AlertCircle, Plus } from "lucide-react";

const userLadders = [
  {
    id: "ladder-1",
    name: "Squash A League",
    rank: 4,
    members: 24,
    status: "active",
  },
  {
    id: "ladder-2",
    name: "Tennis Mixed",
    rank: 7,
    members: 18,
    status: "active",
  },
];

const pendingJoins = [
  {
    id: "ladder-3",
    name: "Badminton Beginners",
    requestedAt: "2024-12-08",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Stay on top of your ladders, challenges, and upcoming matches."
        cta={
          <Link href="/challenges/create" className="btn btn-primary">
            <Swords className="h-4 w-4" />
            New challenge
          </Link>
        }
      />

      {/* My Ladders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">My Ladders</h2>
          <Link href="/ladders" className="text-sm font-semibold text-brand-600 hover:underline">
            View all
          </Link>
        </div>

        {userLadders.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {userLadders.map((ladder) => (
              <Link
                key={ladder.id}
                href={`/ladders/${ladder.id}`}
                className="card group p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 group-hover:text-brand-600">
                      {ladder.name}
                    </h3>
                    <p className="text-sm text-slate-600">{ladder.members} members</p>
                  </div>
                  <div className="rounded-lg bg-brand-100 px-3 py-1">
                    <p className="text-sm font-bold text-brand-700">#{ladder.rank}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card space-y-3 p-5 text-center">
            <Trophy className="mx-auto h-8 w-8 text-slate-400" />
            <p className="text-sm text-slate-600">No ladders yet</p>
            <Link href="/ladders" className="inline-block text-sm font-semibold text-brand-600">
              Browse & join a ladder →
            </Link>
          </div>
        )}
      </div>

      {/* Pending Join Requests */}
      {pendingJoins.length > 0 && (
        <div className="card space-y-4 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">Pending Join Requests</h3>
              <p className="text-sm text-slate-600 mt-1">
                {pendingJoins.length} request{pendingJoins.length > 1 ? "s" : ""} awaiting approval
              </p>
              <ul className="mt-3 space-y-2">
                {pendingJoins.map((join) => (
                  <li key={join.id} className="text-sm text-slate-700">
                    <span className="font-medium">{join.name}</span> - Requested {join.requestedAt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Current Rank"
          value="#4"
          subtitle="Squash A League"
          icon={Trophy}
          trend={{ value: 2, isPositive: true }}
        />
        <StatCard
          title="Active Challenges"
          value="2"
          subtitle="1 to confirm, 1 pending"
          icon={Swords}
        />
        <StatCard
          title="Win Rate"
          value="73%"
          subtitle="Last 10 matches"
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Next Match"
          value="Tomorrow"
          subtitle="vs Riley Chen"
          icon={Calendar}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Performance Overview</h2>
          <ProgressBar label="Matches Won" value={12} max={20} showPercentage />
          <ProgressBar label="Challenges Completed" value={8} max={10} showPercentage />
          <ProgressBar label="Season Progress" value={45} max={90} showPercentage />
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Upcoming Matches</h2>
            <Link className="text-sm font-semibold text-brand-700" href="/matches">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">vs Riley Chen</p>
                <p className="text-xs text-slate-500">Tomorrow at 6:00 PM</p>
              </div>
              <span className="badge badge-success">Accepted</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">vs Jordan Smith</p>
                <p className="text-xs text-slate-500">Dec 15 at 7:30 PM</p>
              </div>
              <span className="badge badge-warning">Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
