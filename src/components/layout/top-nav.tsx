"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, LayoutDashboard, Trophy, Swords, Target, Bell, Settings, Menu, X, LogOut, LogIn } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";

const publicLinks = [
  { href: "/", label: "Home", icon: Home },
];

const authLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["player", "organizer", "admin"] },
  { href: "/ladders", label: "Ladders", icon: Trophy, roles: ["player", "organizer", "admin"] },
  { href: "/challenges", label: "Challenges", icon: Swords, roles: ["player", "organizer", "admin"] },
  { href: "/matches", label: "Matches", icon: Target, roles: ["player", "organizer", "admin"] },
  { href: "/notifications", label: "Notifications", icon: Bell, roles: ["player", "organizer", "admin"] },
  { href: "/admin", label: "Admin", icon: Settings, roles: ["admin", "organizer"] },
];

export function TopNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const { user, isSignedIn, isLoading, signOut } = useAuth();
  const router = useRouter();

  // Fetch pending leader requests count for admins
  useEffect(() => {
    if (user?.role === "admin") {
      const fetchPendingCount = async () => {
        try {
          const response = await fetch("/api/leader-requests");
          if (response.ok) {
            const data = await response.json();
            const pending = data.requests.filter(
              (r: { status: string }) => r.status === "pending"
            ).length;
            setPendingRequests(pending);
          }
        } catch (error) {
          console.error("Error fetching pending requests:", error);
        }
      };

      fetchPendingCount();
      // Poll every 30 seconds
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.role]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    setMobileOpen(false);
  };

  const getVisibleLinks = () => {
    if (!isSignedIn) return publicLinks;
    const filtered = authLinks.filter((link) => link.roles.includes(user?.role || "player"));
    return [publicLinks[0], ...filtered];
  };

  const visibleLinks = getVisibleLinks();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-brand-700">
          <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-bold text-brand-800">
            Ladder
          </span>
          <span className="hidden sm:inline">Sports Challenges</span>
        </Link>

        <nav className="hidden gap-1 md:flex">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand-700"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
              {link.href === "/admin" && pendingRequests > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger-600 text-xs font-bold text-white">
                  {pendingRequests}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!isLoading && (
            <>
              {isSignedIn && user ? (
                <>
                  <div className="hidden flex-col items-end md:flex">
                    <p className="text-xs font-medium text-slate-700">{user.fullName || user.email}</p>
                    <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-danger-50 hover:text-danger-700"
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden md:inline">Sign out</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors bg-brand-600 hover:bg-brand-700"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign in</span>
                </Link>
              )}
            </>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 hover:bg-slate-100 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white p-4 md:hidden">
          <nav className="space-y-1">
            {visibleLinks.map((link) => (
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
          {!isLoading && (
            <>
              {isSignedIn ? (
                <button
                  onClick={handleSignOut}
                  className="btn btn-danger w-full mt-4 flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              ) : (
                <Link className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2" href="/login">
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </header>
  );
}
