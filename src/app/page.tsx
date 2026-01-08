"use client";

import Link from "next/link";
import { ArrowRight, Shield, ShieldCheck, Timer, BarChart3, Users } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

export default function HomePage() {
  const { isSignedIn } = useAuth();

  // Simplified CTAs
  const primaryCta = isSignedIn ? "/dashboard" : "/login";
  const primaryLabel = isSignedIn ? "Go to dashboard" : "Sign in";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          {/* Left: Hero Content */}
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-sm border border-brand-100">
              <Shield className="h-4 w-4" />
              Built for clubs and teams
            </p>

            <h1 className="text-4xl font-bold leading-tight text-slate-900 lg:text-5xl">
              Modern ladder ops with real governance, not demo data.
            </h1>

            <p className="text-lg text-slate-600 max-w-xl">
              Create ladders, control challenges, manage disputes, and keep rankings fair. Role-based views for players, organizers, and admins.
            </p>

            {/* Single CTA */}
            <div>
              <Link
                href={primaryCta}
                className="btn btn-primary shadow-lg inline-flex items-center gap-2"
              >
                {primaryLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Compact Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wide text-slate-500">Clubs</p>
                <p className="text-sm font-semibold text-slate-900">Multi-ladder</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wide text-slate-500">RBAC</p>
                <p className="text-sm font-semibold text-slate-900">3 Roles</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wide text-slate-500">Rules</p>
                <p className="text-sm font-semibold text-slate-900">Governed</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wide text-slate-500">Audit</p>
                <p className="text-sm font-semibold text-slate-900">Ready</p>
              </div>
            </div>
          </div>

          {/* Right: Feature Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4 space-y-2 bg-white/80 backdrop-blur">
              <div className="flex items-center gap-2 text-brand-700">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase">RBAC</p>
              </div>
              <p className="text-xs text-slate-600">Player / Organizer / Admin</p>
            </div>

            <div className="card p-4 space-y-2 bg-white/80 backdrop-blur">
              <div className="flex items-center gap-2 text-brand-700">
                <Timer className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase">Workflows</p>
              </div>
              <p className="text-xs text-slate-600">Leader requests, approvals</p>
            </div>

            <div className="card p-4 space-y-2 bg-white/80 backdrop-blur">
              <div className="flex items-center gap-2 text-brand-700">
                <BarChart3 className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase">Rules</p>
              </div>
              <p className="text-xs text-slate-600">Challenge limits, expiry</p>
            </div>

            <div className="card p-4 space-y-2 bg-white/80 backdrop-blur">
              <div className="flex items-center gap-2 text-brand-700">
                <Users className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase">Audit</p>
              </div>
              <p className="text-xs text-slate-600">Notifications & logs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}