import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

const disputes = [
  {
    id: "d-1",
    matchId: "m-201",
    ladder: "Squash A",
    reason: "Score disagreement",
    submittedBy: "Jordan Smith",
    createdAt: "2025-01-11",
  },
];

export default function DisputesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dispute resolution"
        description="Review contested matches, confirm outcomes, and log decisions."
      />

      <div className="card overflow-hidden">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Match</th>
              <th className="px-4 py-2">Ladder</th>
              <th className="px-4 py-2">Reason</th>
              <th className="px-4 py-2">Submitted</th>
              <th className="px-4 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map((dispute) => (
              <tr key={dispute.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-semibold">{dispute.id}</td>
                <td className="px-4 py-2">{dispute.matchId}</td>
                <td className="px-4 py-2">{dispute.ladder}</td>
                <td className="px-4 py-2 text-slate-700">{dispute.reason}</td>
                <td className="px-4 py-2 text-slate-600">{dispute.createdAt}</td>
                <td className="px-4 py-2 text-right">
                  <Link className="text-sm font-semibold text-brand-700" href={`/admin/disputes/${dispute.id}`}>
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
