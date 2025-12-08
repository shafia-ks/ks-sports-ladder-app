"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Check, X, Trash2, ArrowLeft } from "lucide-react";

const members = [
  {
    id: "m-1",
    name: "John Doe",
    email: "john@example.com",
    status: "active",
    rank: 1,
    joinDate: "2024-12-01",
    isLeader: true,
  },
  {
    id: "m-2",
    name: "Jane Smith",
    email: "jane@example.com",
    status: "active",
    rank: 2,
    joinDate: "2024-12-02",
    isLeader: false,
  },
  {
    id: "m-3",
    name: "Bob Johnson",
    email: "bob@example.com",
    status: "pending",
    rank: null,
    joinDate: "2024-12-08",
    isLeader: false,
  },
  {
    id: "m-4",
    name: "Alice Williams",
    email: "alice@example.com",
    status: "active",
    rank: 3,
    joinDate: "2024-12-03",
    isLeader: false,
  },
];

export default function LadderSettingsPage({ params }: { params: { id: string } }) {
  const [membersList, setMembersList] = useState(members);
  const [loading, setLoading] = useState(false);

  const handleAccept = (memberId: string) => {
    setMembersList((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, status: "active", rank: membersList.length } : m
      )
    );
  };

  const handleDecline = (memberId: string) => {
    setMembersList((prev) => prev.filter((m) => m.id !== memberId));
  };

  const handleRemove = (memberId: string) => {
    setMembersList((prev) => prev.filter((m) => m.id !== memberId));
  };

  const pendingCount = membersList.filter((m) => m.status === "pending").length;
  const activeCount = membersList.filter((m) => m.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/ladders" className="text-brand-600 hover:text-brand-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Squash A League</h1>
          <p className="text-slate-600">Manage members and ladder settings</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-4">
          <p className="text-sm text-slate-600">Active Members</p>
          <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-600">Pending Requests</p>
          <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-600">You are</p>
          <Badge variant="success">Leader</Badge>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingCount > 0 && (
        <div className="card space-y-4 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Pending Join Requests</h2>
          <div className="space-y-3">
            {membersList
              .filter((m) => m.status === "pending")
              .map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-4"
                >
                  <div>
                    <p className="font-medium text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(member.id)}
                      className="rounded-lg bg-success-100 p-2 hover:bg-success-200"
                    >
                      <Check className="h-4 w-4 text-success-700" />
                    </button>
                    <button
                      onClick={() => handleDecline(member.id)}
                      className="rounded-lg bg-danger-100 p-2 hover:bg-danger-200"
                    >
                      <X className="h-4 w-4 text-danger-700" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Active Members */}
      <div className="card space-y-4 p-5">
        <h2 className="text-lg font-semibold text-slate-900">Members ({activeCount})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-2 text-left font-medium text-slate-700">Rank</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Player</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Joined</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Role</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {membersList
                .filter((m) => m.status === "active")
                .map((member) => (
                  <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">#{member.rank}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{member.joinDate}</td>
                    <td className="px-4 py-3">
                      {member.isLeader ? (
                        <Badge variant="brand">Leader</Badge>
                      ) : (
                        <Badge variant="neutral">Member</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!member.isLeader && (
                        <button
                          onClick={() => handleRemove(member.id)}
                          className="rounded-lg p-2 hover:bg-danger-100"
                          title="Remove member"
                        >
                          <Trash2 className="h-4 w-4 text-danger-600" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings */}
      <div className="card space-y-6 p-5">
        <h2 className="text-lg font-semibold text-slate-900">Ladder Settings</h2>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-slate-700">Sport</p>
              <p className="mt-1 text-slate-900">Squash</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Location</p>
              <p className="mt-1 text-slate-900">Downtown Court</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Ranking System</p>
              <p className="mt-1 text-slate-900">Swap Positions (Minimal Drop)</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Max Positions Up</p>
              <p className="mt-1 text-slate-900">3</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button className="btn btn-secondary">Edit Settings</button>
            <button className="btn btn-danger">Archive Ladder</button>
          </div>
        </div>
      </div>
    </div>
  );
}
