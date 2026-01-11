"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Trophy, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isSignedIn) {
      const redirectTo = searchParams?.get("redirectTo") || "/dashboard";
      router.push(redirectTo as any);
    }
  }, [isSignedIn, isLoading, router, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (!supabase) {
      setError("Supabase is not configured");
      setLoading(false);
      return;
    }

    try {
      // First, try to sign in
      const { error: authError, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // If sign in successful, check if email is confirmed and not disabled
      if (data.user) {
        if (!data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          setError("Please confirm your email before signing in.");
          setInfo("Check your inbox for a confirmation link.");
          setLoading(false);
          return;
        }
        const disabled = (data.user.app_metadata as any)?.disabled;
        if (disabled) {
          await supabase.auth.signOut();
          setError("Your account has been disabled. Contact support.");
          setLoading(false);
          return;
        }
      }

      // Success case: loading state will be managed by the redirect in useEffect
      // Keep loading=true to prevent form resubmission
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setError("");
    setInfo("");
    if (!email) {
      setError("Enter your email to reset your password.");
      return;
    }
    if (!supabase) {
      setError("Supabase is not configured");
      return;
    }
    setResetting(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (resetError) {
        setError(resetError.message);
      } else {
        setInfo("Check your email for a reset link.");
      }
    } catch (err) {
      setError("Unable to send reset email. Try again.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl shadow-md">
            <Image
              src="/app-icon-base.png"
              alt="KS Sports Ladder"
              fill
              className="object-cover"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sports Ladder</h1>
          <p className="text-sm text-slate-600">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
              {error}
            </div>
          )}
          {info && (
            <div className="rounded-lg border border-success-200 bg-success-50 p-3 text-sm text-success-700">
              {info}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="w-full text-center text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            {resetting ? "Sending reset email..." : "Forgot password? Send reset link"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-brand-100 px-2 text-slate-600">Don&apos;t have an account?</span>
          </div>
        </div>

        {/* Sign up link */}
        <Link
          href="/signup"
          className="btn btn-secondary w-full"
        >
          Create account
        </Link>

        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">Need access?</p>
          <p>Sign up or contact an admin to be added to a ladder.</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
