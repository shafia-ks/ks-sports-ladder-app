import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Target } from "lucide-react";

export default function MatchesPage() {
  return (
    <ProtectedRoute>
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
        <div className="card p-5 text-center space-y-3">
          <p className="text-sm text-slate-600">No matches yet.</p>
          <div className="flex justify-center">
            <Link href="/matches/submit" className="btn btn-primary">
              <Target className="h-4 w-4" />
              Submit a result
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
