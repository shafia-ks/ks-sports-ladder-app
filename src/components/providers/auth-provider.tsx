"use client";

import { useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";
import { AuthContext, AuthContextType, AuthUser } from "@/lib/auth/auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setIsLoading(false);
      return;
    }

    const ensureProfile = async (sessionUser: any) => {
      try {
        const { data: profile, error } = await client
          .from("users")
          .select("id, email, first_name, last_name, full_name, avatar_url, role")
          .eq("id", sessionUser.id)
          .single();

        if (profile) {
          return profile;
        }

        // If not found (PGRST116 = no rows), create it
        if (error && error.code === "PGRST116") {
          const firstName = sessionUser.user_metadata?.first_name || sessionUser.user_metadata?.firstName || "";
          const lastName = sessionUser.user_metadata?.last_name || sessionUser.user_metadata?.lastName || "";
          const fullName =
            sessionUser.user_metadata?.full_name ||
            sessionUser.user_metadata?.fullName ||
            `${firstName} ${lastName}`.trim();

          // Insert new profile only (don't update existing ones to preserve role)
          const { data: inserted, error: insertError} = await client
            .from("users")
            .insert({
              id: sessionUser.id,
              email: sessionUser.email,
              first_name: firstName || null,
              last_name: lastName || null,
              full_name: fullName || sessionUser.email,
              role: "player",
            })
            .select()
            .single();

          if (insertError) {
            console.error("Profile insert error:", insertError);
            return null;
          }

          return inserted;
        }

        // Other errors - log them
        console.error("Profile fetch error:", error);
        return null;
      } catch (err) {
        console.error("ensureProfile error:", err);
        return null;
      }
    };

    // Check current session
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await client.auth.getSession();

        if (session?.user) {
          // Fetch or create profile (block initial render to avoid role flicker)
          const profile = await ensureProfile(session.user);

          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email,
              firstName: profile.first_name,
              lastName: profile.last_name,
              fullName: profile.full_name,
              avatarUrl: profile.avatar_url,
              role: profile.role || "player",
            });
          } else {
            // Fallback: don't set role if profile fetch failed
            // This prevents the "unauthorized" redirect on slow networks
            setUser({
              id: session.user.id,
              email: session.user.email || "",
            } as any);
          }

          setIsSignedIn(true);
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log("Auth state change:", event, session?.user?.email);
      
      if (event === "SIGNED_OUT") {
        setUser(null);
        setIsSignedIn(false);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          console.log("Fetching profile for user:", session.user.id);
          
          // Set timeout for profile fetch (15 seconds - more reasonable for Supabase)
          const timeoutPromise = new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error("Profile fetch timeout")), 15000)
          );

          const startedAt = Date.now();
          
          try {
            const profile = await Promise.race([
              ensureProfile(session.user),
              timeoutPromise,
            ]);

            const durationMs = Date.now() - startedAt;

            if (profile) {
              setUser({
                id: profile.id,
                email: profile.email,
                firstName: profile.first_name,
                lastName: profile.last_name,
                fullName: profile.full_name,
                avatarUrl: profile.avatar_url,
                role: profile.role || "player",
              });
              setIsSignedIn(true);
              console.log("Auth state updated with profile", { durationMs });
            } else {
              // Only fall back if profile fetch explicitly returned null (not on timeout)
              console.warn("Profile fetch returned null, using fallback");
              setUser({
                id: session.user.id,
                email: session.user.email || "",
                role: "player",
              });
              setIsSignedIn(true);
              console.log("Auth state updated with fallback", { durationMs });
            }
          } catch (err) {
            const durationMs = Date.now() - startedAt;
            console.error("Profile fetch error or timeout", { err, durationMs });
            // CRITICAL: Don't downgrade role on timeout - keep user signed in with minimal info
            // This prevents role flicker when database is slow
            setUser({
              id: session.user.id,
              email: session.user.email || "",
              // Don't set role here - let it stay undefined/null to indicate incomplete auth state
            } as any);
            setIsSignedIn(true);
            console.log("Auth state updated after error (incomplete)", { durationMs });
          }
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const client = supabase;
    if (!client) return;
    
    try {
      // Sign out from Supabase
      await client.auth.signOut();
      
      // Clear local state
      setUser(null);
      setIsSignedIn(false);
      
      // Clear any cached data
      if (typeof window !== "undefined") {
        // Clear local storage items related to auth
        localStorage.removeItem("supabase.auth.token");
        // Reload to clear any in-memory state
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Sign out error:", error);
      // Force clear state even if signOut fails
      setUser(null);
      setIsSignedIn(false);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isSignedIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
