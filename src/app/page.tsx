"use client";

import Link from "next/link";
import { ArrowRight, Shield, ShieldCheck, Timer, BarChart3, Users } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

const featureList = [
  {
    title: "Role-based access",
    body: "Players, organizers, and admins get the right controls—no clutter, no confusion.",
    icon: ShieldCheck,
  },
  {
    title: "Challenge governance",
    body: "Challenge limits, expiry, and busy player checks to keep ladders fair.",

    icon: Timer,
  },
  {
    title: "Ranking your way",
    body: "Swap, minimal drop, slide, or points configure per ladder.",
    icon: BarChart3,
  },
  {
    title: "Club-grade oversight",
    body: "Leader requests, seasons, disputes, and audit friendly notifications.",
    icon: Users,
  },
];

export default function HomePage() {
  const { isSignedIn } = useAuth();

  // Primary hero CTA logic (only dashboard when signed in)
  // User requested removing "Sign in" below text for non-users, so we only show this if signed in?
  // User said "remove sign in below text create ladders...". 
  // If signed in, "Go to dashboard" is useful. If not, maybe show nothing or just not "Sign in"?
  // Re-reading: "2) remove sign in below text create ladders..."
  // I will hide the hero button entirely for non-signed-in users, or remove it as requested.
  // Actually, typical pattern is if signed in -> Dashboard. If not -> maybe nothing since bottom banner has it?

  return (
    <div className="space-y-8">
      <section className="card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-slate-50" />
        <div className="relative grid gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">

          {/* Left Column: Hero Text */}
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow">
                <Shield className="h-4 w-4" />
                Built for clubs and teams
              </p>
              <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
                Modern sports ladder ops with club grade controls and governance
              </h1>
              <p className="text-lg text-slate-700 max-w-2xl">
                Create ladders, control challenges, manage disputes, and keep rankings fair. Role-based views for players, organizers, and admins—ready for production.
              </p>
            </div>

            {/* CTA Button: Only show if signed in, otherwise empty as per request to remove "Sign in" below text */}
            {isSignedIn && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/dashboard" className="btn btn-primary shadow inline-flex items-center gap-2">
                  Go to dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Right Column: 4 Key Features 2x2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {featureList.map((item) => (
              <div key={item.title} className="card p-3 border-slate-200 bg-white/60 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-1 text-brand-700">
                  <item.icon className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-wide">{item.title}</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Row "Ready to challenge?" */}
      <section className="card border-brand-100 bg-brand-50/50 p-6 md:p-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Ready to challenge?</h2>
            <p className="text-slate-600">Join your local club ladder or start your own today.</p>
          </div>
          <div className="flex items-center gap-3">
            {!isSignedIn ? (
              <>
                <Link href="/signup" className="btn bg-green-600 hover:bg-green-700 text-white border-transparent shadow-sm">
                  Create account
                </Link>
                <Link href="/login" className="btn btn-primary shadow-sm">
                  Sign in
                </Link>
              </>
            ) : (
              <Link href="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}