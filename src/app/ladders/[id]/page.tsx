"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface LadderMember {
  id: string;
  user_id: string;
  current_rank: number | null;
  status: string;
  users?: {
    id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

interface LadderResponse {
  ladder: {
    id: string;
    name: string;
    description: string | null;
    location: string | null;
    visibility: string;
    status: string;
    challenge_rules: any;
    ranking_rules: any;
  } | null;
  members: LadderMember[];
  error?: string;
}

export default function LadderDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<LadderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLadder = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/ladders/${params.id}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to load ladder");
        }
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ladder");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLadder();
  }, [params.id]);

  const ladderName = data?.ladder?.name ?? "Ladder";
  const members = data?.members ?? [];
  const activeMembers = members.filter((m) => m.status === "active");

  return (
    <div className="space-y-6">
      <PageHeader
        title={ladderName}
        description={data?.ladder?.description || "Ranking overview and membership."}
        cta={
          <div className="flex gap-2">
            <Link
              href="/ladders"
              className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold hover:border-brand-200"
            >
              Join ladder
            </Link>
            <Link
              href={`/challenges/create?ladder=${params.id}`}
              className="rounded-full bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Challenge
            </Link>
          </div>
        }
      />

      {isLoading && (
        <div className="card p-5 text-center text-sm text-slate-600 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading ladder...
        </div>
      )}

      {error && (
        <div className="card p-5 text-center text-sm text-red-600">{error}</div>
      )}

      {!isLoading && !error && (!data?.ladder || activeMembers.length === 0) && (
        <div className="card p-5 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-800">No rankings yet.</p>
          <p className="text-sm text-slate-600">Once members join and matches are reported, rankings will appear here.</p>
        </div>
      )}

      {!isLoading && !error && data?.ladder && activeMembers.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-semibold text-slate-700">Ranking</p>
            <span className="text-xs text-slate-500">{data.ladder.ranking_rules?.type || "Ranking"}</span>
          </div>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Rank</th>
                <th className="px-4 py-2">Player</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {activeMembers.map((member) => (
                <tr key={member.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-semibold">#{member.current_rank ?? "-"}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={member.users?.full_name || `${member.users?.first_name ?? ""} ${member.users?.last_name ?? ""}`}
                        email={member.users?.email}
                        src={undefined}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium text-slate-900">
                          {member.users?.full_name || `${member.users?.first_name ?? ""} ${member.users?.last_name ?? ""}`.trim() || "Member"}
                        </p>
                        <p className="text-xs text-slate-500">{member.users?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      className="text-sm font-semibold text-brand-700"
                      href={`/challenges/create?ladder=${params.id}&opponent=${member.user_id}`}
                    >
                      Challenge
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
