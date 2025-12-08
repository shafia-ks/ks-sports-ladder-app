import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

const mockMembers = [
  { rank: 1, name: "Casey Lee", wins: 12, losses: 2 },
  { rank: 2, name: "Riley Chen", wins: 10, losses: 4 },
  { rank: 3, name: "Avery Patel", wins: 9, losses: 5 },
  { rank: 4, name: "Jordan Smith", wins: 7, losses: 6 },
];

export default function LadderDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Ladder: ${params.id}`}
        description="Ranking overview with quick actions to challenge and view matches."
        cta={
          <div className="flex gap-2">
            <Link
              href={`/ladders/${params.id}/join`}
              className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold hover:border-brand-200"
            >
              Join ladder
            </Link>
            <Link
              href={`/challenges/create?ladder=${params.id}`}
              className="rounded-full bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Challenge
            </Link>
          </div>
        }
      />

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <p className="text-sm font-semibold text-slate-700">Ranking</p>
          <span className="text-xs text-slate-500">Swap + minimal drop rule</span>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Rank</th>
              <th className="px-4 py-2">Player</th>
              <th className="px-4 py-2">Record</th>
              <th className="px-4 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {mockMembers.map((member) => (
              <tr key={member.rank} className="border-t border-slate-100">
                <td className="px-4 py-2 font-semibold">#{member.rank}</td>
                <td className="px-4 py-2">{member.name}</td>
                <td className="px-4 py-2 text-slate-600">
                  W {member.wins} · L {member.losses}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    className="text-sm font-semibold text-brand-700"
                    href={`/challenges/create?opponent=${member.rank}`}
                  >
                    Challenge
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
