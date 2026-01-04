"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/lib/auth/auth-context";
import { ArrowLeft, Loader2, Mail, Plus } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface Ladder {
  id: string;
  name: string;
}

function InviteMembersPage() {
  const { user } = useAuth();
  const params = useParams() as { id: string } | null;
  const ladderId = params?.id || "";

  const [ladder, setLadder] = useState<Ladder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (ladderId) {
      fetchLadder();
    }
  }, [ladderId]);

  const fetchLadder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ladders/${ladderId}`);
      if (!res.ok) throw new Error("Failed to load ladder");
      const data = await res.json();
      setLadder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ladder");
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !user?.id) return;

    setIsInviting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          invited_by: user.id,
          ladder_id: ladderId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send invitation");
      }

      setSuccess(`Invitation sent to ${email}`);
      setEmail("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/organizer/${ladderId}/members`} className="text-brand-600 hover:text-brand-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title={`${ladder?.name || "Ladder"} - Invite Members`}
          description="Send invitations to join this ladder"
        />
      </div>

      {loading && (
        <div className="card p-6 text-center flex items-center justify-center gap-2 text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      )}

      {error && (
        <div className="card p-4 text-sm text-red-600 bg-red-50">{error}</div>
      )}

      {success && (
        <div className="card p-4 text-sm text-green-600 bg-green-50">{success}</div>
      )}

      {!loading && (
        <div className="card space-y-6 p-6">
          <form onSubmit={handleSendInvitation} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="person@example.com"
                className="w-full mt-2 rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                The person will receive an email with a link to join the ladder.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Message (Optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message..."
                rows={3}
                className="w-full mt-2 rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={isInviting || !email.trim()}
              className="btn btn-primary flex items-center justify-center gap-2 w-full"
            >
              {isInviting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Invitation
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function OrganizerInvitePage() {
  return (
    <ProtectedRoute requiredRoles={["organizer"]}>
      <InviteMembersPage />
    </ProtectedRoute>
  );
}
