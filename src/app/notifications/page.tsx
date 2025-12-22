import { PageHeader } from "@/components/ui/page-header";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="In-app alerts for challenges, matches, expiry, and admin updates."
      />
        <div className="card p-5 text-center space-y-3">
          <p className="text-sm text-slate-600">You have no notifications yet.</p>
          <p className="text-xs text-slate-500">
            Activity from challenges, matches, and admin updates will show up here.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
