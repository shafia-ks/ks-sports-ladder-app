import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Swords, Calendar, MapPin } from "lucide-react";

const challenges = [
  {
    id: "ch-101",
    ladder: "Squash A",
    challenger: "Casey Lee",
    challenged: "Jordan Smith",
    status: "Pending" as const,
    scheduled: "2025-01-12 18:00",
    location: "Court 3",
  },
  {
    id: "ch-102",
    ladder: "Tennis Mixed",
    challenger: "Riley Chen",
    challenged: "Avery Patel",
    status: "Accepted" as const,
    scheduled: "2025-01-15 19:30",
    location: "Downtown Club",
  },
];

export default function ChallengesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Challenges"
        description="Track outgoing and incoming challenges with status, expiry, and actions."
        cta={
          <Link href="/challenges/create" className="btn btn-primary">
            <Swords className="h-4 w-4" />
            Create challenge
          </Link>
        }
      />

      <div className="space-y-3">
        {challenges.map((challenge) => (
          <div key={challenge.id} className="card p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{challenge.id}</h3>
                  <StatusBadge status={challenge.status} type="challenge" />
                </div>
                <p className="text-sm text-slate-700">
                  <span className="font-medium">{challenge.challenger}</span> → <span className="font-medium">{challenge.challenged}</span>
                  <span className="mx-2 text-slate-400">•</span>
                  <span className="text-slate-600">{challenge.ladder}</span>
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {challenge.scheduled}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {challenge.location}
                  </span>
                </div>
              </div>
              <Link
                href={`/challenges/${challenge.id}`}
                className="btn btn-secondary text-sm"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
