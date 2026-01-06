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

        if (error && error.code && error.code !== "PGRST116") {
          console.error("Profile fetch error:", error);
        }

        const firstName = sessionUser.user_metadata?.first_name || sessionUser.user_metadata?.firstName || "";
        const lastName = sessionUser.user_metadata?.last_name || sessionUser.user_metadata?.lastName || "";
        const fullName = sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.fullName || `${firstName} ${lastName}`.trim();

        const { data: upserted, error: upsertError } = await client
          .from("users")
          .upsert({
            id: sessionUser.id,
            email: sessionUser.email,
            first_name: firstName || null,
            last_name: lastName || null,
            full_name: fullName || sessionUser.email,
            role: "player",
          })
          .select()
          .single();

        if (upsertError) {
          console.error("Profile upsert error:", upsertError);
          return null;
        }

        return upserted;
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
            // Fallback to session data
            setUser({
              id: session.user.id,
              email: session.user.email || "",
              role: "player",
            });
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
      console.log('Auth state change:', event, session?.user?.email);
      
      if (event === "SIGNED_OUT") {
        setUser(null);
        setIsSignedIn(false);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          console.log('Fetching profile for user:', session.user.id);
          
          // Set timeout for profile fetch (5 seconds)
          const timeoutPromise = new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
          );
          
          try {
            const profile = await Promise.race([
              ensureProfile(session.user),
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
              console.log('Auth state updated with profile');
            } else {
              setUser({
                id: session.user.id,
                email: session.user.email || "",
                role: "player",
              });
              setIsSignedIn(true);
              console.log('Auth state updated with fallback');
            }
          } catch (err) {
            console.error('Profile fetch error or timeout:', err);
            // Use session data as fallback
            setUser({
              id: session.user.id,
              email: session.user.email || "",
              role: "player",
            });
            setIsSignedIn(true);
            console.log('Auth state updated after error');
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
      if (typeof window !== 'undefined') {
        // Clear local storage items related to auth
        localStorage.removeItem('supabase.auth.token');
        // Reload to clear any in-memory state
        window.location.href = '/';
      }
    } catch (error) {
      console.error("Sign out error:", error);
      // Force clear state even if signOut fails
      setUser(null);
      setIsSignedIn(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/';
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
