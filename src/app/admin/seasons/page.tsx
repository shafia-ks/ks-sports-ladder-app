import { PageHeader } from "@/components/ui/page-header";

const seasons = [
  { id: "s-01", ladder: "Squash A", name: "Winter 2025", status: "Active", range: "Jan 1 - Mar 31" },
  { id: "s-02", ladder: "Tennis Mixed", name: "Spring 2025", status: "Planned", range: "Apr 1 - Jun 30" },
];

export default function SeasonsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Season management"
        description="Start, close, and archive ladder seasons with ranking snapshots."
      />

      <div className="card overflow-hidden">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Ladder</th>
              <th className="px-4 py-2">Season</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Dates</th>
            </tr>
          </thead>
          <tbody>
            {seasons.map((season) => (
              <tr key={season.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-semibold">{season.id}</td>
                <td className="px-4 py-2">{season.ladder}</td>
                <td className="px-4 py-2">{season.name}</td>
                <td className="px-4 py-2">
                  <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-bold text-brand-800">
                    {season.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-600">{season.range}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
