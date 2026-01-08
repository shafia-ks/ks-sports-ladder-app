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
    body: "Challenge limits, expiry, and busy-player checks to keep ladders fair.",
    icon: Timer,
  },
  {
    title: "Ranking your way",
    body: "Swap, minimal-drop, slide, or points—configure per ladder.",
    icon: BarChart3,
  },
  {
    title: "Club-grade oversight",
    body: "Leader requests, seasons, disputes, and audit-friendly notifications.",
    icon: Users,
  },
];

const stats = [
  { label: "Clubs ready", value: "Multi-ladder" },
  { label: "RBAC", value: "Player / Org / Admin" },
  { label: "Governance", value: "Expiry • Limits" },
  { label: "Audit", value: "Notifications & logs" },
];

export default function HomePage() {
  const { isSignedIn } = useAuth();
  const primaryCta = isSignedIn ? "/dashboard" : "/login";
  const primaryLabel = isSignedIn ? "Go to dashboard" : "Sign in";

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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href={primaryCta} className="btn btn-primary shadow inline-flex items-center gap-2">
                {primaryLabel} <ArrowRight className="h-4 w-4" />
              </Link>
              {!isSignedIn && (
                <span className="text-sm font-medium text-slate-600">
                  Ready to challenge? Create an account or sign in.
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Feature Card */}
          <div className="card border-slate-100 bg-white/80 p-6 shadow-sm">
            <div className="grid gap-6 md:grid-cols-2 items-center relative">

              {/* Top Right Icon */}
              <div className="absolute -top-2 -right-2 p-2 bg-brand-50 rounded-full text-brand-600">
                <ShieldCheck className="h-6 w-6" />
              </div>

              {/* Left Side: Content */}
              <div className="space-y-3 pr-4">
                <h3 className="text-lg font-semibold text-slate-900">Club-grade controls</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Role-based access, challenge governance, seasons, and audit-friendly notifications. Ready for multi-ladder clubs.
                </p>
              </div>

              {/* Right Side: 2x2 Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-2 text-center">
                  <p className="font-semibold text-slate-900 mb-1">RBAC</p>
                  <p className="leading-tight">Player / Org / Admin</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-2 text-center">
                  <p className="font-semibold text-slate-900 mb-1">Workflows</p>
                  <p className="leading-tight">Requests & Approvals</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-2 text-center">
                  <p className="font-semibold text-slate-900 mb-1">Rules</p>
                  <p className="leading-tight">Limits & Expiry</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-2 text-center">
                  <p className="font-semibold text-slate-900 mb-1">Audit</p>
                  <p className="leading-tight">Logs & Notifs</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {featureList.map((item) => (
          <div key={item.title} className="card p-4 space-y-2">
            <div className="flex items-center gap-2 text-brand-700">
              <item.icon className="h-4 w-4" />
              <p className="text-sm font-semibold uppercase tracking-wide">{item.title}</p>
            </div>
            <p className="text-sm text-slate-700">{item.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}