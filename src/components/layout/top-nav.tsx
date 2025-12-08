"use client";

import Link from "next/link";
import { Home, LayoutDashboard, Trophy, Swords, Target, Bell, Settings, Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ladders", label: "Ladders", icon: Trophy },
  { href: "/challenges", label: "Challenges", icon: Swords },
  { href: "/matches", label: "Matches", icon: Target },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/admin", label: "Admin", icon: Settings },
];

export function TopNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-brand-700">
          <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-bold text-brand-800">
            Ladder
          </span>
          <span>Sports Challenges</span>
        </Link>

        <nav className="hidden gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand-700"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 hover:bg-slate-100 md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white p-4 md:hidden">
          <nav className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-brand-700"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            className="btn btn-primary mt-4 w-full"
            href="/login"
            onClick={() => setMobileOpen(false)}
          >
            Sign in
          </Link>
        </div>
      )}
    </header>
  );
}
