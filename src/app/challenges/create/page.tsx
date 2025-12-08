import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export default function ChallengeCreatePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create challenge"
        description="Select ladder, opponent, and propose schedule. Validations enforced per ladder rules."
      />

      <form className="card space-y-4 p-5">
        <div>
          <label className="text-sm font-semibold text-slate-700">Ladder</label>
          <select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option>Squash A</option>
            <option>Tennis Mixed</option>
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700">Opponent</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Search player"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Scheduled time</label>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Location</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Court location"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Notes</label>
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            rows={3}
            placeholder="Optional details or constraints"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Submit challenge
          </button>
          <Link className="text-sm font-semibold text-slate-600" href="/challenges">
            Cancel
          </Link>
        </div>
        <p className="text-xs text-slate-500">
          Challenge validations: rank range, busy-player checks, active cap, self-challenge prevention, expiry will auto-apply.
        </p>
      </form>
    </div>
  );
}
