import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Trophy, Users, MapPin, Plus } from "lucide-react";

const ladders = [
  {
    id: "ladder-1",
    name: "Squash A League",
    sport: "Squash",
    location: "Downtown Court",
    members: 24,
    status: "Active",
    description: "Competitive squash ladder for advanced players",
  },
  {
    id: "ladder-2",
    name: "Tennis Mixed Doubles",
    sport: "Tennis",
    location: "Central Park",
    members: 18,
    status: "Active",
    description: "Mixed doubles tennis ladder for all levels",
  },
  {
    id: "ladder-3",
    name: "Badminton Beginners",
    sport: "Badminton",
    location: "Sports Complex",
    members: 12,
    status: "Active",
    description: "Friendly badminton ladder for beginners",
  },
  {
    id: "ladder-4",
    name: "Racquetball Pro",
    sport: "Racquetball",
    location: "Fitness Center",
    members: 8,
    status: "Waiting for approval",
    description: "High-level racquetball competition",
  },
];

export default function LaddersPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <PageHeader
          title="Ladders"
          description="Join a ladder and start competing with other players."
          cta={
            <Link href="/ladders/create" className="btn btn-primary">
              <Plus className="h-4 w-4" />
              Create ladder
            </Link>
          }
        />

        <div className="grid gap-4 md:grid-cols-2">
          {ladders.map((ladder) => (
            <div key={ladder.id} className="card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-brand-100 p-2">
                    <Trophy className="h-5 w-5 text-brand-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{ladder.name}</h3>
                    <p className="text-xs text-slate-500">{ladder.sport}</p>
                  </div>
                </div>
                <Badge variant={ladder.status === "Active" ? "success" : "warning"}>
                  {ladder.status}
                </Badge>
              </div>

              <p className="text-sm text-slate-600">{ladder.description}</p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {ladder.location}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {ladder.members} members
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <Link
                  href={`/ladders/${ladder.id}`}
                  className="btn btn-secondary text-sm flex-1"
                >
                  View
                </Link>
                <button className="btn btn-primary text-sm flex-1">Join</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
