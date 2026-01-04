"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface Invitation {
  id: string;
  email: string;
  ladder_id?: string;
  ladders?: {
    id: string;
    name: string;
  };
}

export default function SignUpWithInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams() || new URLSearchParams();
  const invitationId = searchParams.get("invitation");

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  useEffect(() => {
    if (!invitationId) {
      setError("No invitation found. Please check the link.");
      setLoading(false);
      return;
    }

    fetchInvitation();
  }, [invitationId]);

  const fetchInvitation = async () => {
    try {
      // Get invitation by ID
      const res = await fetch(`/api/invitations/${invitationId}`);
      if (!res.ok) {
        throw new Error("Invitation not found or has expired");
      }

      const data = await res.json();
      setInvitation(data.invitation);
      setFormData((prev) => ({
        ...prev,
        email: data.invitation.email,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsSigningUp(true);

    try {
      // Sign up with Supabase
      if (!supabase) throw new Error("Supabase not configured");
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user?.id) throw new Error("Failed to create account");

      // Create user profile
      const { error: profileError } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          role: "player",
        });

      if (profileError) throw profileError;

      // Accept the invitation
      if (invitationId) {
        const acceptRes = await fetch(`/api/invitations/${invitationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "accept",
            user_id: authData.user.id,
          }),
        });

        if (!acceptRes.ok) {
          console.error("Failed to accept invitation, but account was created");
        }
      }

      setSignupSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
    } finally {
      setIsSigningUp(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (signupSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 p-4">
        <div className="max-w-md w-full card p-8 text-center space-y-6">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Account Created!</h1>
            <p className="text-slate-600 mt-2">
              Welcome! Your account has been created and you've been added to{" "}
              {invitation?.ladders?.name || "the ladder"}.
            </p>
          </div>
          <p className="text-sm text-slate-500">
            Check your email to verify your account and get started.
          </p>
          <Link
            href="/login"
            className="btn btn-primary flex items-center justify-center gap-2 w-full"
          >
            Go to Login
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 p-4">
      <div className="max-w-md w-full card p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Join the Ladder</h1>
          <p className="text-sm text-slate-600 mt-2">
            You've been invited to join{" "}
            <span className="font-semibold">
              {invitation?.ladders?.name || "a ladder"}
            </span>
            . Create your account to get started!
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50 text-slate-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="At least 8 characters"
              className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSigningUp}
            className="w-full btn btn-primary flex items-center justify-center gap-2 mt-6"
          >
            {isSigningUp && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSigningUp ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-600 hover:text-brand-700 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
