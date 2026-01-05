"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, Eye, EyeOff, Check } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { validatePassword } from "@/lib/auth/password-validation";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validating, setValidating] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "fair" | "good" | "strong">("weak");

  // Check if user has a valid session from reset link
  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) {
        setError("Supabase is not configured");
        setValidating(false);
        return;
      }

      try {
        // Supabase automatically handles the token in the URL hash
        // Just check if there's a session after the redirect
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          // No session yet - might still be loading, wait a moment
          setTimeout(async () => {
            const { data: retryData } = await supabase.auth.getSession();
            if (!retryData.session) {
              setError("Reset link expired or invalid. Please request a new one.");
              setTimeout(() => router.push("/login"), 3000);
            }
            setValidating(false);
          }, 500);
          return;
        }
        
        setValidating(false);
      } catch (err) {
        console.error("Session check error:", err);
        setValidating(false);
      }
    };

    // Small delay to let Supabase process the URL hash
    setTimeout(checkSession, 300);
  }, [router]);

  // Validate password strength
  useEffect(() => {
    if (password) {
      const validation = validatePassword(password);
      setPasswordStrength(validation.strength);
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError(validation.errors[0] || "Password does not meet requirements.");
      return;
    }

    if (!supabase) {
      setError("Supabase is not configured");
      return;
    }

    setLoading(true);

    try {
      // Update password via Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
      } else {
        setSuccess(true);
        // Give user feedback then redirect
        await new Promise(resolve => setTimeout(resolve, 1500));
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Failed to update password. Please try again.");
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 px-4">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          <p className="text-slate-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-brand-600 p-3">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Set New Password</h1>
          <p className="text-sm text-slate-600">Create a strong password for your account</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="rounded-lg border border-success-200 bg-success-50 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-success-600" />
              <p className="font-medium text-success-700">Password updated successfully!</p>
            </div>
            <p className="text-sm text-success-600">Redirecting to dashboard...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
            {error}
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {password && (
                <div className="text-xs text-slate-600">
                  Strength: <span className={`font-medium ${
                    passwordStrength === "weak" ? "text-danger-600" :
                    passwordStrength === "fair" ? "text-warning-600" :
                    passwordStrength === "good" ? "text-info-600" :
                    "text-success-600"
                  }`}>
                    {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  disabled={loading}
                >
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="text-xs text-slate-600 space-y-1 rounded-lg bg-slate-50 p-3">
              <p className="font-medium text-slate-700">Password must have:</p>
              <ul className="list-inside space-y-0.5">
                <li>• At least 8 characters</li>
                <li>• At least one uppercase letter</li>
                <li>• At least one lowercase letter</li>
                <li>• At least one number</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full rounded-lg bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        {/* Back to Login */}
        <p className="text-center text-sm text-slate-600">
          Remember your password?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
