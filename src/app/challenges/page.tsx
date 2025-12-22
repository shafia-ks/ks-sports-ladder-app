import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Swords } from "lucide-react";

export default function ChallengesPage() {
  return (
    <ProtectedRoute>
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
        <div className="card p-5 text-center space-y-3">
          <p className="text-sm text-slate-600">No challenges yet.</p>
          <div className="flex justify-center">
            <Link href="/challenges/create" className="btn btn-primary">
              <Swords className="h-4 w-4" />
              Create your first challenge
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
