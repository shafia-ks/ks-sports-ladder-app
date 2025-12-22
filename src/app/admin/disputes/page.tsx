import { PageHeader } from "@/components/ui/page-header";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function DisputesPage() {
  return (
    <ProtectedRoute requiredRoles={["admin", "organizer"]}>
      <div className="space-y-6">
        <PageHeader
          title="Dispute resolution"
          description="Review contested matches, confirm outcomes, and log decisions."
        />

        <div className="card p-5 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-800">No disputes yet.</p>
          <p className="text-sm text-slate-600">Match disputes will appear here for admins and organizers.</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
