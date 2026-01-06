"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: ("player" | "organizer" | "admin")[];
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requiredRoles = ["player", "organizer", "admin"],
  fallbackPath = "/login",
}: ProtectedRouteProps) {
  const { isSignedIn, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Don't do anything while loading
    
    if (!isSignedIn) {
      router.push((fallbackPath || "/login") as any);
      return;
    }

    // If user is signed in but role is missing/incomplete, wait longer before redirecting
    // This handles cases where profile fetch is still pending
    if (user && !user.role) {
      console.warn("User signed in but role incomplete, not redirecting yet");
      return; // Don't redirect - let component handle incomplete auth
    }

    if (user && !requiredRoles.includes(user.role)) {
      console.log(`User role "${user.role}" not in required roles [${requiredRoles.join(", ")}], redirecting to home`);
      router.push(("/") as any);
      return;
    }
  }, [isSignedIn, isLoading, user, requiredRoles, fallbackPath, router]);

  // While loading, show skeleton (don't block with spinner)
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  // If role is incomplete, show loading state
  if (user && !user.role) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (user && !requiredRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-slate-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
