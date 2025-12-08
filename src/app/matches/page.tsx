import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Target, Trophy, Calendar } from "lucide-react";

const matches = [
  {
    id: "m-201",
    ladder: "Squash A",
    players: "Casey Lee vs Jordan Smith",
    winner: "Casey Lee",
    status: "Submitted" as const,
    playedAt: "2025-01-10",
  },
  {
    id: "m-202",
    ladder: "Tennis Mixed",
    players: "Riley Chen vs Avery Patel",
    winner: "Riley Chen",
    status: "Confirmed" as const,
    playedAt: "2025-01-08",
  },
];

export default function MatchesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Matches"
        description="Submit scores, confirm results, and view history."
        cta={
          <Link href="/matches/submit" className="btn btn-primary">
            <Target className="h-4 w-4" />
            Submit result
          </Link>
        }
      />

      <div className="space-y-3">
        {matches.map((match) => (
          <div key={match.id} className="card p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{match.id}</h3>
                  <StatusBadge status={match.status} type="match" />
                </div>
                <p className="text-sm text-slate-700">
                  {match.players}
                  <span className="mx-2 text-slate-400">•</span>
                  <span className="text-slate-600">{match.ladder}</span>
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    Winner: <span className="font-medium text-slate-700">{match.winner}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {match.playedAt}
                  </span>
                </div>
              </div>
              <Link href={`/matches/${match.id}`} className="btn btn-secondary text-sm">
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
