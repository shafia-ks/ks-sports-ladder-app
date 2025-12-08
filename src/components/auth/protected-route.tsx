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
    if (!isLoading && !isSignedIn) {
      router.push(fallbackPath as any);
      return;
    }

    if (!isLoading && isSignedIn && user && !requiredRoles.includes(user.role)) {
      router.push("/" as any);
      return;
    }
  }, [isSignedIn, isLoading, user, requiredRoles, fallbackPath, router]);

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

  if (!isSignedIn) {
    return null;
  }

  if (user && !requiredRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-slate-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
