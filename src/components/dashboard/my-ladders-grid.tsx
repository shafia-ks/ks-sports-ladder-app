import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import type { LadderMembership, Ladder } from "../../types";

// Extended type for membership with joined ladder data
interface EnrichedMembership extends LadderMembership {
    ladders?: Ladder;
    match_count?: number;
    last_played?: string;
}

interface MyLaddersGridProps {
    memberships: EnrichedMembership[];
    loading: boolean;
}

export function MyLaddersGrid({ memberships, loading }: MyLaddersGridProps) {
    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        );
    }

    if (memberships.length === 0) {
        return (
            <div className="card p-8 text-center bg-slate-50 border-dashed">
                <div className="mx-auto h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center mb-3">
                    <Trophy className="h-6 w-6 text-slate-400" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No Active Ladders</h3>
                <p className="text-sm text-slate-600 mb-4 max-w-xs mx-auto">
                    Join a ladder to start competing and tracking your rank!
                </p>
                <Link href="/ladders" className="btn btn-primary inline-flex">
                    Browse Ladders
                </Link>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {memberships.map((membership) => (
                <div key={membership.id} className="card p-0 overflow-hidden hover:shadow-md transition-shadow group">
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-brand-600 transition-colors">
                                {membership.ladders?.name}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${membership.ladders?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                {membership.ladders?.status}
                            </span>
                        </div>

                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-3xl font-bold text-slate-900">
                                #{membership.current_rank}
                            </span>
                            <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                                Current Rank
                            </span>
                        </div>

                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-4">
                            {/* Todo: Visualization of progress/percentile */}
                            <div className="bg-brand-500 h-full rounded-full" style={{ width: '60%' }}></div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{membership.match_count || 0} matches played</span>
                            {membership.last_played ? (
                                <span>Last: {new Date(membership.last_played).toLocaleDateString()}</span>
                            ) : (
                                <span className="text-brand-600">New!</span>
                            )}
                        </div>
                    </div>

                    <Link
                        href={`/ladders/${membership.ladder_id}`}
                        className="block w-full bg-slate-50 p-3 text-center text-sm font-medium text-slate-600 hover:bg-slate-100 border-t border-slate-100 transition-colors"
                    >
                        View Ladder <ArrowRight className="inline-block h-3 w-3 ml-1" />
                    </Link>
                </div>
            ))}
        </div>
    );
}
