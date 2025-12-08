"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useEffect } from "react";
import { validatePassword } from "@/lib/auth/password-validation";
import { PasswordStrength } from "@/components/ui/password-strength";

const GDPR_TEXT = `
# Privacy Policy & Data Protection

## 1. Data Controller
Sports Ladder Application is the data controller for your personal information.

## 2. Personal Data We Collect
- **Identity Data**: First name, last name, email address
- **Account Data**: Password (hashed), user preferences, role/permissions
- **Performance Data**: Ladder rankings, match history, challenge records
- **Communication Data**: Notifications, dispute records

## 3. Legal Basis for Processing
We process your data based on:
- **Contract**: Necessary to provide the Sports Ladder service
- **Consent**: GDPR compliance and service improvements
- **Legal Obligation**: Tax, audit, and fraud prevention

## 4. Your GDPR Rights
You have the right to:
- **Access**: Request a copy of your personal data
- **Rectification**: Correct inaccurate data
- **Erasure**: Request deletion of your data (right to be forgotten)
- **Restriction**: Limit how we process your data
- **Portability**: Export your data in a portable format
- **Objection**: Opt-out of certain processing
- **Withdraw Consent**: Revoke consent at any time

## 5. Data Retention
- Account data: Retained for duration of account; 30 days after deletion
- Performance data: Retained for 7 years for audit purposes
- You can request deletion at any time via dashboard

## 6. Data Security
- All passwords encrypted with industry-standard algorithms
- HTTPS/TLS for data in transit
- Regular security audits and penetration testing
- Restricted staff access with role-based controls

## 7. Third-Party Sharing
We do NOT share your data with third parties except:
- **Service providers**: Only with signed data processing agreements
- **Legal requirement**: If compelled by law enforcement
- **Your consent**: If you explicitly authorize

## 8. International Transfers
Data is processed in accordance with GDPR. Any international transfers include adequate safeguards.

## 9. Contact Us
For data protection inquiries:
- Email: privacy@sportsladder.app
- Data Protection Officer available upon request

## 10. Your Choices
- Opt-out of marketing communications anytime
- Control notification preferences in settings
- Manage data visibility and profile privacy
`;

const SPORTSMANSHIP_TEXT = `
# Code of Conduct & Sportsmanship Agreement

## Core Principles
By joining the Sports Ladder community, you commit to:

1. **Fair Play**: Play according to official rules and the spirit of the sport
2. **Honesty**: Report match results truthfully and resolve disputes fairly
3. **Respect**: Treat all players, officials, and staff with dignity
4. **Integrity**: Accept wins and losses graciously
5. **Safety**: Prioritize the wellbeing of all participants

## Conduct Standards
- Communicate respectfully with opponents and peers
- Avoid unsportsmanlike behavior (throwing equipment, verbal abuse, intimidation)
- Comply with match scheduling and attendance expectations
- Report technical issues or concerns promptly
- Support a welcoming environment for all skill levels

## Dispute Resolution
- Disputes must be reported within 48 hours
- Provide evidence and documentation
- Participate in good-faith resolution process
- Accept admin decisions with professionalism

## Consequences
Violations may result in:
- Suspension from challenges
- Removal from ladders
- Account termination for severe violations

## Community Values
We believe competitive sports build character. Help us maintain a community of:
- Excellence through dedicated practice
- Humility in victory, grace in defeat
- Camaraderie and mutual respect
- Lifelong sportsmanship

Thank you for upholding these values.
`;

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordValidation, setPasswordValidation] = useState(validatePassword(""));
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [sportsmanshipAccepted, setSportsmanshipAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGdprModal, setShowGdprModal] = useState(false);
  const [showSportsmanshipModal, setShowSportsmanshipModal] = useState(false);
  const router = useRouter();
  const { isSignedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, isLoading, router]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordValidation(validatePassword(newPassword));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required");
      return;
    }

    if (!passwordValidation.isValid) {
      setError("Password does not meet security requirements");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!gdprAccepted || !sportsmanshipAccepted) {
      setError("You must accept Privacy Policy and Sportsmanship Code");
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
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
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
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
                First Name *
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
                Last Name *
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email *
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
              Password *
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {password && <PasswordStrength validation={passwordValidation} />}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
              Confirm Password *
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
                Privacy Policy
              </button>
              {" "}(GDPR Compliant) *
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
                Code of Conduct
              </button>
              {" "}*
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
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto space-y-4 rounded-lg bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Privacy Policy & Data Protection</h2>
            <div className="prose prose-sm max-w-none text-slate-700">
              {GDPR_TEXT.split("\n").map((paragraph, idx) => {
                if (paragraph.startsWith("#")) {
                  const match = paragraph.match(/^#+/);
                  const level = match ? match[0].length : 1;
                  const text = paragraph.replace(/^#+\s/, "");
                  const className =
                    level === 1
                      ? "text-xl font-bold text-slate-900 mt-4 mb-2"
                      : level === 2
                        ? "text-lg font-semibold text-slate-900 mt-3 mb-1"
                        : "font-semibold text-slate-800 mt-2";
                  return (
                    <p key={idx} className={className}>
                      {text}
                    </p>
                  );
                }
                if (paragraph.startsWith("- ")) {
                  return (
                    <p key={idx} className="ml-4 text-slate-700">
                      • {paragraph.slice(2)}
                    </p>
                  );
                }
                return paragraph ? (
                  <p key={idx} className="text-slate-700 mb-2">
                    {paragraph}
                  </p>
                ) : null;
              })}
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setGdprAccepted(true);
                  setShowGdprModal(false);
                }}
                className="btn btn-primary flex-1"
              >
                I Agree
              </button>
              <button onClick={() => setShowGdprModal(false)} className="btn btn-secondary flex-1">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sportsmanship Modal */}
      {showSportsmanshipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto space-y-4 rounded-lg bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Code of Conduct & Sportsmanship</h2>
            <div className="prose prose-sm max-w-none text-slate-700">
              {SPORTSMANSHIP_TEXT.split("\n").map((paragraph, idx) => {
                if (paragraph.startsWith("#")) {
                  const match = paragraph.match(/^#+/);
                  const level = match ? match[0].length : 1;
                  const text = paragraph.replace(/^#+\s/, "");
                  const className =
                    level === 1
                      ? "text-xl font-bold text-slate-900 mt-4 mb-2"
                      : level === 2
                        ? "text-lg font-semibold text-slate-900 mt-3 mb-1"
                        : "font-semibold text-slate-800 mt-2";
                  return (
                    <p key={idx} className={className}>
                      {text}
                    </p>
                  );
                }
                if (paragraph.match(/^\d+\./)) {
                  const match = paragraph.match(/^(\d+\.\s*\*?\*?.*?\*?\*?)(:.*)$/);
                  if (match) {
                    return (
                      <p key={idx} className="font-semibold text-slate-800 mt-2">
                        {match[1]}
                        <span className="font-normal">{match[2]}</span>
                      </p>
                    );
                  }
                }
                if (paragraph.startsWith("- ")) {
                  return (
                    <p key={idx} className="ml-4 text-slate-700">
                      • {paragraph.slice(2)}
                    </p>
                  );
                }
                return paragraph ? (
                  <p key={idx} className="text-slate-700 mb-2">
                    {paragraph}
                  </p>
                ) : null;
              })}
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setSportsmanshipAccepted(true);
                  setShowSportsmanshipModal(false);
                }}
                className="btn btn-primary flex-1"
              >
                I Agree
              </button>
              <button
                onClick={() => setShowSportsmanshipModal(false)}
                className="btn btn-secondary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
