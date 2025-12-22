import { PageHeader } from "@/components/ui/page-header";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function SeasonsPage() {
  return (
    <ProtectedRoute requiredRoles={["admin", "organizer"]}>
      <div className="space-y-6">
        <PageHeader
          title="Season management"
          description="Start, close, and archive ladder seasons with ranking snapshots."
        />

        <div className="card p-5 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-800">No seasons configured.</p>
          <p className="text-sm text-slate-600">Create a ladder and start a season to see data here.</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
