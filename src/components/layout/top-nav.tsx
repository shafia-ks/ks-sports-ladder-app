"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, LayoutDashboard, Trophy, Bell, Settings, Menu, X, LogOut, LogIn, Users, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Avatar } from "@/components/ui/avatar";

const publicLinks = [
  { href: { pathname: "/" }, label: "Home", icon: Home },
];

// Navigation links by role
const playerLinks = [
  { href: { pathname: "/dashboard" }, label: "Dashboard", icon: LayoutDashboard },
  { href: { pathname: "/ladders" }, label: "Ladders", icon: Trophy },
  { href: { pathname: "/notifications" }, label: "Notifications", icon: Bell },
];

const organizerLinks = [
  { href: { pathname: "/organizer" }, label: "My Ladders", icon: Trophy },
  { href: { pathname: "/dashboard" }, label: "Dashboard", icon: LayoutDashboard },
  { href: { pathname: "/notifications" }, label: "Notifications", icon: Bell },
];

const adminConsoleLink = { href: { pathname: "/admin" }, label: "Admin Console", icon: Settings };

export function TopNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [pendingJoins, setPendingJoins] = useState(0);
  const [pendingInvites, setPendingInvites] = useState(0);
  const { user, isSignedIn, isLoading, signOut } = useAuth();
  const router = useRouter();

  // Fetch pending organizer requests count for admins
  useEffect(() => {
    if (user?.role === "admin") {
      let retryCount = 0;
      const maxRetries = 3;
      
      const fetchPendingCount = async () => {
        try {
          const response = await fetch("/api/leader-requests");
          if (response.ok) {
            const data = await response.json();
            const pending = data.requests.filter(
              (r: { status: string }) => r.status === "pending"
            ).length;
            setPendingRequests(pending);
            retryCount = 0; // Reset on success
          }
        } catch (error) {
          retryCount++;
          // Only log errors for the first few attempts to avoid console spam
          if (retryCount <= maxRetries) {
            console.warn("Unable to fetch pending requests (will retry)");
          }
        }
      };

      fetchPendingCount();
      // Poll every 30 seconds
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.role]);

  // Fetch player pending joins and invitations (admins can also participate as players)
  useEffect(() => {
    if ((user?.role === "player" || user?.role === "admin") && user?.id && user?.email) {
      let retryCount = 0;
      const maxRetries = 3;

      const fetchCounts = async () => {
        try {
          const [membershipsRes, invitationsRes] = await Promise.all([
            fetch(`/api/memberships?user_id=${user.id}`),
            fetch(`/api/invitations?email=${encodeURIComponent(user.email)}`),
          ]);

          if (membershipsRes.ok) {
            const memberships = await membershipsRes.json();
            const pendingCount = (memberships?.pending ?? []).length;
            setPendingJoins(pendingCount);
          }

          if (invitationsRes.ok) {
            const invites = await invitationsRes.json();
            const inviteCount = (invites?.invitations ?? []).length;
            setPendingInvites(inviteCount);
          }
          retryCount = 0;
        } catch (error) {
          retryCount++;
          if (retryCount <= maxRetries) {
            console.warn("Unable to fetch player pending counts (will retry)");
          }
        }
      };

      fetchCounts();
      const interval = setInterval(fetchCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.role, user?.id, user?.email]);

  const handleSignOut = async () => {
    setMobileOpen(false);
    await signOut();
    // signOut now handles navigation via window.location
  };

  // Get links based on user role
  const getVisibleLinks = () => {
    if (!isSignedIn) return publicLinks;
    
    switch (user?.role) {
      case "admin":
        // Admins see player navigation plus a dedicated Admin Console tab
        return [...publicLinks, ...playerLinks, adminConsoleLink];
      case "organizer":
        return [...publicLinks, ...organizerLinks];
      case "player":
      default:
        return [...publicLinks, ...playerLinks];
    }
  };

  const visibleLinks = getVisibleLinks();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href={{ pathname: "/" }} className="flex items-center gap-3 font-semibold text-brand-700">
          <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-800">
            Ladder
          </span>
          <span className="hidden sm:inline text-slate-900">KS Sports Ladder</span>
        </Link>

        <nav className="hidden gap-1 md:flex">
          {visibleLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand-700"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
              {link.href.pathname === "/admin" && pendingRequests > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger-600 text-xs font-bold text-white">
                  {pendingRequests}
                </span>
              )}
              {link.href.pathname === "/ladders" && (pendingJoins + pendingInvites) > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                  {Math.min(pendingJoins + pendingInvites, 9)}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!isLoading && (
            <>
              {isSignedIn && user ? (
                <div className="hidden items-center gap-3 md:flex">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-100 transition"
                    title="Profile settings"
                  >
                    <Avatar name={user.fullName} email={user.email} src={user.avatarUrl} size="sm" />
                  </Link>
                  <div className="flex flex-col items-start">
                    <p className="text-xs font-medium text-slate-800">{user.fullName || user.email}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-danger-50 hover:text-danger-700"
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden lg:inline">Sign out</span>
                  </button>
                </div>
              ) : (
                <Link
                  href={{ pathname: "/login" }}
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
                key={link.label}
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
                <Link className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2" href={{ pathname: "/login" }}>
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
