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

    // Check current session
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await client.auth.getSession();

        if (session?.user) {
          // Set basic user immediately from session
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            role: "player",
          });
          setIsSignedIn(true);
          setIsLoading(false);
          
          // Fetch full profile in background (don't block)
          client
            .from("users")
            .select("id, email, first_name, last_name, full_name, avatar_url, role")
            .eq("id", session.user.id)
            .single()
            .then(({ data: profile, error }) => {
              if (error) {
                console.error("Profile fetch error:", error);
              } else if (profile) {
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
            });
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
          // Fetch updated profile
          const { data: profile } = await client
            .from("users")
            .select("id, email, first_name, last_name, full_name, avatar_url, role")
            .eq("id", session.user.id)
            .single();

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
