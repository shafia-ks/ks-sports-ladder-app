"use client";

import Link from "next/link";
import { ArrowLeft, Swords } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export default function LadderChallengesPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/ladders/${params.id}`} className="text-brand-600 hover:text-brand-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title="Challenges"
          description="Active and completed challenges for this ladder."
          cta={
            <Link href="/challenges/create" className="btn btn-primary flex items-center gap-2">
              <Swords className="h-4 w-4" />
              New Challenge
            </Link>
          }
        />
      </div>

      <div className="card p-8 text-center">
        <Swords className="h-12 w-12 mx-auto text-slate-300 mb-4" />
        <p className="text-slate-600">No challenges yet. Create one to get started!</p>
        <Link href="/challenges/create" className="btn btn-primary inline-block mt-4">
          Create Challenge
        </Link>
      </div>
    </div>
  );
}
