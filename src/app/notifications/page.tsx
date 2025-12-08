import { PageHeader } from "@/components/ui/page-header";

const notifications = [
  {
    id: "n-1",
    message: "New challenge from Casey Lee (Squash A)",
    link: "/challenges/ch-101",
    read: false,
    createdAt: "2h ago",
  },
  {
    id: "n-2",
    message: "Match result awaiting your confirmation (m-201)",
    link: "/matches/m-201",
    read: false,
    createdAt: "1d ago",
  },
  {
    id: "n-3",
    message: "Challenge ch-099 expired automatically",
    link: "/challenges/ch-099",
    read: true,
    createdAt: "3d ago",
  },
];

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="In-app alerts for challenges, matches, expiry, and admin updates."
      />

      <div className="card divide-y divide-slate-100">
        {notifications.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm text-slate-800">{item.message}</p>
              <p className="text-xs text-slate-500">{item.createdAt}</p>
            </div>
            <span
              className={`rounded-full px-2 py-1 text-xs font-bold ${
                item.read ? "bg-slate-100 text-slate-500" : "bg-brand-100 text-brand-800"
              }`}
            >
              {item.read ? "Read" : "New"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
