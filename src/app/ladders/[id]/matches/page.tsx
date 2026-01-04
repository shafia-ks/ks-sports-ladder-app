"use client";

import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export default function LadderMatchesPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/ladders/${params.id}`} className="text-brand-600 hover:text-brand-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title="Matches"
          description="All matches reported for this ladder."
          cta={
            <Link href="/matches/submit" className="btn btn-primary flex items-center gap-2">
              <Target className="h-4 w-4" />
              Submit Match
            </Link>
          }
        />
      </div>

      <div className="card p-8 text-center">
        <Target className="h-12 w-12 mx-auto text-slate-300 mb-4" />
        <p className="text-slate-600">No matches yet. Start competing!</p>
        <Link href="/matches/submit" className="btn btn-primary inline-block mt-4">
          Submit Match
        </Link>
      </div>
    </div>
  );
}
