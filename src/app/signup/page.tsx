"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

const GDPR_TEXT = `We respect your privacy. Your data is used only for ladder management and will never be shared with third parties. You can request deletion at any time.`;

const SPORTSMANSHIP_TEXT = `Play fairly and respectfully. Report disputes honestly. Accept wins and losses graciously. Treat all players with respect.`;

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [sportsmanshipAccepted, setSportsmanshipAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGdprModal, setShowGdprModal] = useState(false);
  const [showSportsmanshipModal, setShowSportsmanshipModal] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!gdprAccepted || !sportsmanshipAccepted) {
      setError("You must accept GDPR and sportsmanship agreements");
      return;
    }

    setLoading(true);

    if (!supabase) {
      setError("Supabase is not configured");
      setLoading(false);
      return;
    }

    try {
      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Create user profile with GDPR/sportsmanship acceptance
      if (authData.user) {
        const { error: profileError } = await supabase
          .from("users")
          .insert({
            id: authData.user.id,
            email,
            full_name: name,
            gdpr_accepted: true,
            gdpr_accepted_at: new Date().toISOString(),
            sportsmanship_accepted: true,
            sportsmanship_accepted_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          // Continue anyway, user can update later
        }
      }

      // Auto-login
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError("Account created, but login failed. Please sign in manually.");
        router.push("/login");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-brand-600 p-3">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sports Ladder</h1>
          <p className="text-sm text-slate-600">Create your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

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
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* GDPR Checkbox */}
          <div className="flex items-start gap-2">
            <input
              id="gdpr"
              type="checkbox"
              checked={gdprAccepted}
              onChange={(e) => setGdprAccepted(e.target.checked)}
              className="mt-1 rounded border-slate-300"
            />
            <label htmlFor="gdpr" className="text-xs text-slate-600">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => setShowGdprModal(true)}
                className="font-semibold text-brand-600 hover:underline"
              >
                privacy policy
              </button>
            </label>
          </div>

          {/* Sportsmanship Checkbox */}
          <div className="flex items-start gap-2">
            <input
              id="sportsmanship"
              type="checkbox"
              checked={sportsmanshipAccepted}
              onChange={(e) => setSportsmanshipAccepted(e.target.checked)}
              className="mt-1 rounded border-slate-300"
            />
            <label htmlFor="sportsmanship" className="text-xs text-slate-600">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => setShowSportsmanshipModal(true)}
                className="font-semibold text-brand-600 hover:underline"
              >
                sportsmanship code
              </button>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-brand-100 px-2 text-slate-600">Already have an account?</span>
          </div>
        </div>

        {/* Sign in link */}
        <Link href="/login" className="btn btn-secondary w-full">
          Sign in
        </Link>
      </div>

      {/* GDPR Modal */}
      {showGdprModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Privacy Policy</h2>
            <p className="text-sm text-slate-700">{GDPR_TEXT}</p>
            <button
              onClick={() => {
                setGdprAccepted(true);
                setShowGdprModal(false);
              }}
              className="btn btn-primary w-full"
            >
              I Agree
            </button>
            <button
              onClick={() => setShowGdprModal(false)}
              className="btn btn-secondary w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Sportsmanship Modal */}
      {showSportsmanshipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Sportsmanship Code</h2>
            <p className="text-sm text-slate-700">{SPORTSMANSHIP_TEXT}</p>
            <button
              onClick={() => {
                setSportsmanshipAccepted(true);
                setShowSportsmanshipModal(false);
              }}
              className="btn btn-primary w-full"
            >
              I Agree
            </button>
            <button
              onClick={() => setShowSportsmanshipModal(false)}
              className="btn btn-secondary w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
