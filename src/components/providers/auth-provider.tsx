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

    let isFetching = false;
    let cachedProfile: any = null;

    // Load profile from localStorage (persistent cache)
    const loadCachedProfile = (userId: string) => {
      try {
        const cached = localStorage.getItem(`profile_${userId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          // Check if cached data is less than 24 hours old
          if (parsed.cachedAt && Date.now() - parsed.cachedAt < 24 * 60 * 60 * 1000) {
            return parsed.profile;
          }
        }
      } catch (err) {
        console.error("Failed to load cached profile:", err);
      }
      return null;
    };

    // Save profile to localStorage
    const saveCachedProfile = (userId: string, profile: any) => {
      try {
        localStorage.setItem(`profile_${userId}`, JSON.stringify({
          profile,
          cachedAt: Date.now()
        }));
      } catch (err) {
        console.error("Failed to save cached profile:", err);
      }
    };

    const ensureProfile = async (sessionUser: any, useCache: boolean = true) => {
      // Check localStorage first (synchronous, instant)
      if (useCache) {
        const localCached = loadCachedProfile(sessionUser.id);
        if (localCached) {
          cachedProfile = localCached;
          return localCached;
        }
      }

      // Prevent duplicate fetches
      if (isFetching) {
        return cachedProfile;
      }
      
      // Return in-memory cache if available
      if (cachedProfile && cachedProfile.id === sessionUser.id) {
        return cachedProfile;
      }

      isFetching = true;
      try {
        const { data: profile, error } = await client
          .from("users")
          .select("id, email, first_name, last_name, full_name, avatar_url, role")
          .eq("id", sessionUser.id)
          .single();

        if (profile) {
          cachedProfile = profile;
          saveCachedProfile(sessionUser.id, profile); // Save to localStorage
          isFetching = false;
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
            isFetching = false;
            return null;
          }

          cachedProfile = inserted;
          saveCachedProfile(sessionUser.id, inserted); // Save to localStorage
          isFetching = false;
          return inserted;
        }

        // Other errors - log them
        console.error("Profile fetch error:", error);
        isFetching = false;
        return null;
      } catch (err) {
        console.error("ensureProfile error:", err);
        isFetching = false;
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
          // Try localStorage first (instant, synchronous)
          const cachedFromStorage = loadCachedProfile(session.user.id);
          
          if (cachedFromStorage) {
            // Set user immediately from cache - no waiting
            setUser({
              id: cachedFromStorage.id,
              email: cachedFromStorage.email,
              firstName: cachedFromStorage.first_name,
              lastName: cachedFromStorage.last_name,
              fullName: cachedFromStorage.full_name,
              avatarUrl: cachedFromStorage.avatar_url,
              role: cachedFromStorage.role || "player",
            });
            setIsSignedIn(true);
            setIsLoading(false);
            
            // Optionally refresh in background to verify (non-blocking)
            ensureProfile(session.user, false).catch(err => 
              console.error("Background profile refresh failed:", err)
            );
            return;
          }

          // No cache - fetch from database (first-time load)
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
      // Only log significant events, not every token refresh
      if (event !== "TOKEN_REFRESHED") {
        console.log("Auth state change:", event, session?.user?.email);
      }
      
      if (event === "SIGNED_OUT") {
        setUser(null);
        setIsSignedIn(false);
        cachedProfile = null;
        // Clear localStorage cache on sign out
        try {
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith("profile_")) {
              localStorage.removeItem(key);
            }
          });
        } catch (err) {
          console.error("Failed to clear profile cache:", err);
        }
      } else if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          // Try localStorage first (instant load)
          const localCached = loadCachedProfile(session.user.id);
          
          if (localCached) {
            // Set user immediately from cache for instant UI
            setUser({
              id: localCached.id,
              email: localCached.email,
              firstName: localCached.first_name,
              lastName: localCached.last_name,
              fullName: localCached.full_name,
              avatarUrl: localCached.avatar_url,
              role: localCached.role || "player",
            });
            setIsSignedIn(true);
            
            // Background refresh to detect role changes (non-blocking)
            if (event !== "TOKEN_REFRESHED") {
              ensureProfile(session.user, false).then(freshProfile => {
                if (freshProfile && freshProfile.role !== localCached.role) {
                  // Role changed in database - update UI immediately
                  console.log("Role changed from", localCached.role, "to", freshProfile.role);
                  setUser({
                    id: freshProfile.id,
                    email: freshProfile.email,
                    firstName: freshProfile.first_name,
                    lastName: freshProfile.last_name,
                    fullName: freshProfile.full_name,
                    avatarUrl: freshProfile.avatar_url,
                    role: freshProfile.role || "player",
                  });
                }
              }).catch(err => {
                // Background refresh failed - ignore, cache is still valid
                if (event === "SIGNED_IN") {
                  console.error("Background profile refresh failed:", err);
                }
              });
            }
            return;
          }

          // No cache - fetch from database (first-time load)
          const startedAt = Date.now();
          
          try {
            const timeoutPromise = new Promise<any>((_, reject) =>
              setTimeout(() => reject(new Error("Profile fetch timeout")), 5000)
            );

            const profile = await Promise.race([
              ensureProfile(session.user, false),
              timeoutPromise,
            ]);

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
            }
          } catch (err) {
            const durationMs = Date.now() - startedAt;
            console.error("Profile fetch error or timeout", { err, durationMs });
            // No cache and fetch failed - minimal user object
            setUser({
              id: session.user.id,
              email: session.user.email || "",
            } as AuthUser);
            setIsSignedIn(true);
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
        // Clear profile cache
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith("profile_")) {
            localStorage.removeItem(key);
          }
        });
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

  const refreshProfile = async () => {
    const client = supabase;
    if (!client) return;

    try {
      const { data: { session } } = await client.auth.getSession();
      if (!session?.user) return;

      // Clear localStorage cache for this user
      localStorage.removeItem(`profile_${session.user.id}`);

      // Fetch fresh profile
      const { data: profile } = await client
        .from("users")
        .select("id, email, first_name, last_name, full_name, avatar_url, role")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        // Save fresh profile to cache
        localStorage.setItem(`profile_${session.user.id}`, JSON.stringify({
          profile,
          cachedAt: Date.now()
        }));

        // Update UI
        setUser({
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          fullName: profile.full_name,
          avatarUrl: profile.avatar_url,
          role: profile.role || "player",
        });
      }
    } catch (error) {
      console.error("Profile refresh error:", error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isSignedIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
