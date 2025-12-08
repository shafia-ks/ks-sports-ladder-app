import Link from "next/link";
import { ArrowRight, Shield, Sparkles } from "lucide-react";

const highlights = [
  {
    title: "Configurable ranking",
    description: "Swap, minimal-drop, slide-shift, and point-based extensibility.",
  },
  {
    title: "Challenge governance",
    description: "Busy-player checks, max active challenges, auto-expiry, clear errors.",
  },
  {
    title: "Admin-grade controls",
    description: "Seasons, dispute workflows, audit logging, RBAC-ready.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-slate-50" />
        <div className="relative grid gap-8 px-8 py-10 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow">
              <Shield className="h-4 w-4" />
              Multi-ladder, multi-club ready
            </p>
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Sports ladder challenges built for modern clubs.
            </h1>
            <p className="text-lg text-slate-700">
              Mobile-first experience for ladders, challenges, matches, seasons, notifications, and audit-ready admin flows.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-white shadow hover:bg-brand-700"
              >
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/ladders"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-900 shadow-sm hover:border-brand-200"
              >
                Browse ladders
              </Link>
            </div>
          </div>
          <div className="card space-y-3 border-slate-100 bg-white/70 p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
              <span>Live ladder snapshot</span>
              <Sparkles className="h-4 w-4 text-brand-500" />
            </div>
            <ul className="space-y-2 text-sm">
              {[1, 2, 3, 4, 5].map((rank) => (
                <li
                  key={rank}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
                >
                  <span className="flex items-center gap-3">
                    <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-bold text-brand-800">
                      #{rank}
                    </span>
                    Player {rank}
                  </span>
                  <span className="text-xs text-slate-500">W {6 - rank} · L {rank - 1}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <div key={item.title} className="card p-5">
            <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.description}</p>
          </div>
        ))}
      </section>

      <section className="card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Quick navigation</h2>
            <p className="text-sm text-slate-600">Jump into the core flows of the app.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["/ladders", "Ladder overview"],
              ["/challenges/create", "Create challenge"],
              ["/matches/submit", "Submit match"],
              ["/admin", "Admin console"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm hover:border-brand-200"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
