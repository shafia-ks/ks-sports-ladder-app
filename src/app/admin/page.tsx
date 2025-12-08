import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ProtectedRoute } from "@/components/auth/protected-route";

const cards = [
  {
    title: "Leader Requests",
    description: "Review and approve/reject player requests to become group leaders.",
    href: "/admin/leader-requests",
  },
  {
    title: "Ladder settings",
    description: "Configure rules, ranking modes, challenge limits, visibility.",
    href: "/admin/ladders",
  },
  {
    title: "Seasons",
    description: "Start/close seasons, archive standings, carry-over setup.",
    href: "/admin/seasons",
  },
  {
    title: "Disputes",
    description: "Resolve match disputes and confirm ranking adjustments.",
    href: "/admin/disputes",
  },
];

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={["admin", "organizer"]}>
      <div className="space-y-6">
      <PageHeader
        title="Admin console"
        description="Organizer tools with audit logging and RBAC-ready controls."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="card block p-4 hover:border-brand-200">
            <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{card.description}</p>
            <span className="mt-3 inline-block text-sm font-semibold text-brand-700">Open</span>
          </Link>
        ))}
      </div>
    </ProtectedRoute>
  );
}
