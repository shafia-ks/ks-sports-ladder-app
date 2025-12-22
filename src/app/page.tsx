"use client";

import Link from "next/link";
import { ArrowRight, Shield, Sparkles, BarChart3, Users, ShieldCheck, Timer } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useEffect } from "react";

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

const steps = [
  { title: "Create or join", body: "Spin up a ladder or request to join an existing one." },
  { title: "Challenge & play", body: "Send governed challenges, report scores, and confirm results." },
  { title: "Rank & review", body: "Rankings update instantly with clear audit trails." },
];

const stats = [
  { label: "Clubs ready", value: "Multi-ladder" },
  { label: "RBAC", value: "Player / Org / Admin" },
  { label: "Governance", value: "Expiry • Limits" },
  { label: "Audit", value: "Notifications & logs" },
];

export default function HomePage() {
  const { isSignedIn, isLoading } = useAuth();

  useEffect(() => {
    // keep landing accessible for signed-in users
  }, [isLoading, isSignedIn]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const primaryCta = isSignedIn ? "/dashboard" : "/signup";
  const primaryLabel = isSignedIn ? "Go to dashboard" : "Create account";
  const secondaryCta = isSignedIn ? "/ladders" : "/login";
  const secondaryLabel = isSignedIn ? "Browse ladders" : "Sign in";

  return (
    <div className="space-y-12">
      <section className="card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-slate-50" />
        <div className="relative grid gap-10 px-8 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-5">
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
            <div className="flex flex-wrap gap-3">
              <Link
                href={primaryCta}
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-white shadow hover:bg-brand-700"
              >
                {primaryLabel} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={secondaryCta}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-slate-900 shadow-sm hover:border-brand-200"
              >
                {secondaryLabel}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-700 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-slate-200 bg-white/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
                  <p className="text-base font-semibold text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-4 border-slate-100 bg-white/80 p-6 shadow-sm">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
              <span>Club-grade controls</span>
              <Sparkles className="h-4 w-4 text-brand-500" />
            </div>
            <p className="text-sm text-slate-700">
              Role-based access, challenge governance, seasons, and audit-friendly notifications. Ready for multi-ladder clubs.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <p className="font-semibold text-slate-900">RBAC</p>
                <p>Player / Organizer / Admin</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <p className="font-semibold text-slate-900">Workflows</p>
                <p>Leader requests, approvals</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <p className="font-semibold text-slate-900">Rules</p>
                <p>Challenge limits, expiry</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <p className="font-semibold text-slate-900">Audit-ready</p>
                <p>Notifications & logs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {featureList.map((item) => (
          <div key={item.title} className="card p-5 space-y-3">
            <div className="flex items-center gap-2 text-brand-700">
              <item.icon className="h-4 w-4" />
              <p className="text-sm font-semibold uppercase tracking-wide">{item.title}</p>
            </div>
            <p className="text-sm text-slate-700">{item.body}</p>
          </div>
        ))}
      </section>

      <section className="card p-6 space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">How it works</h2>
            <p className="text-sm text-slate-600">From ladder creation to ranked results.</p>
          </div>
          <div className="flex gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-brand-50 px-2 py-1 font-semibold text-brand-700">Governed</span>
            <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">Audit-ready</span>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, idx) => (
            <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
                  {idx + 1}
                </span>
                <p className="font-semibold text-slate-900">{step.title}</p>
              </div>
              <p className="mt-2 text-sm text-slate-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Ready to compete?</h2>
            <p className="text-sm text-slate-600">Create a ladder, invite players, or jump into an existing one.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={primaryCta}
              className="rounded-full bg-brand-600 text-white px-4 py-2 text-sm font-semibold hover:bg-brand-700"
            >
              {primaryLabel}
            </Link>
            <Link
              href={secondaryCta}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 hover:border-brand-200"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}