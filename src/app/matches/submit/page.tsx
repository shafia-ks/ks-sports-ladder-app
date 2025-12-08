import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export default function MatchSubmitPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Submit match"
        description="Record scores with per-set input; opponent will be asked to confirm."
      />

      <form className="card space-y-4 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700">Ladder</label>
            <select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option>Squash A</option>
              <option>Tennis Mixed</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Challenge (optional)</label>
            <select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option>None</option>
              <option>ch-101</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700">Player 1</label>
            <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Player 2</label>
            <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Set scores</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="e.g., 11-8, 9-11, 11-7"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700">Winner</label>
            <select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option>Player 1</option>
              <option>Player 2</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Played at</label>
            <input type="datetime-local" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Submit result
          </button>
          <Link className="text-sm font-semibold text-slate-600" href="/matches">
            Cancel
          </Link>
        </div>
        <p className="text-xs text-slate-500">
          Confirmation will trigger ranking recalculation (swap/minimal-drop/slide) and audit logging.
        </p>
      </form>
    </div>
  );
}
