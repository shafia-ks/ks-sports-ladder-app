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
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow">
              <Shield className="h-4 w-4" />
              Built for clubs and teams
            </p>
            <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
              Modern ladder ops with real governance, not demo data.
            </h1>
            <p className="text-lg text-slate-700 max-w-2xl">
              Create ladders, control challenges, manage disputes, and keep rankings fair. Role-based views for players, organizers, and admins—ready for production.
            </p>
            <div>
              <Link href={primaryCta} className="btn btn-primary shadow inline-flex items-center gap-2">
                {primaryLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-700 sm:grid-cols-4 pt-2">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-slate-200 bg-white/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
                  <p className="text-sm font-semibold text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-3 border-slate-100 bg-white/80 p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
              <span>Club-grade controls</span>
            </div>
            <p className="text-sm text-slate-700">
              Role-based access, challenge governance, seasons, and audit-friendly notifications. Ready for multi-ladder clubs.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-2">
                <p className="font-semibold text-slate-900">RBAC</p>
                <p>Player / Organizer / Admin</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-2">
                <p className="font-semibold text-slate-900">Workflows</p>
                <p>Leader requests, approvals</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-2">
                <p className="font-semibold text-slate-900">Rules</p>
                <p>Challenge limits, expiry</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-2">
                <p className="font-semibold text-slate-900">Audit-ready</p>
                <p>Notifications & logs</p>
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