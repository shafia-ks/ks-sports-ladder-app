import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { SkeletonCard } from "@/components/ui/skeleton-card";

// Extended type for membership with joined ladder data
interface EnrichedMembership {
    id: string;
    ladder_id: string;
    user_id: string;
    current_rank: number;
    status: string;
    ladders?: {
        name: string;
        status: string;
        image_url?: string;
        sport_id?: string;
    };
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
            <div className="space-y-4">
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
        <div className="space-y-4">
            {memberships.map((membership) => (
                <div key={membership.id} className="card p-5 hover:shadow-md transition-shadow group">
                    <div className="flex items-start gap-4">
                        {/* Ladder Avatar */}
                        <div className="flex-shrink-0">
                            {membership.ladders?.image_url ? (
                                <img
                                    src={membership.ladders.image_url}
                                    alt={membership.ladders.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (fallback) fallback.classList.remove('hidden');
                                    }}
                                />
                            ) : null}
                            <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-2xl ${membership.ladders?.image_url ? 'hidden' : ''}`}>
                                {membership.ladders?.name?.charAt(0).toUpperCase() || 'L'}
                            </div>
                        </div>

                        {/* Ladder Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-brand-600 transition-colors">
                                        {membership.ladders?.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {membership.ladders?.sport_id || 'Sport'}
                                    </p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${membership.ladders?.status === 'active'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {membership.ladders?.status}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 mb-3">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-slate-900">
                                        #{membership.current_rank}
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                                        Rank
                                    </span>
                                </div>

                                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-brand-500 h-full rounded-full" style={{ width: '60%' }}></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span>{membership.match_count || 0} matches</span>
                                    {membership.last_played ? (
                                        <span>Last: {new Date(membership.last_played).toLocaleDateString()}</span>
                                    ) : (
                                        <span className="text-brand-600 font-medium">New!</span>
                                    )}
                                </div>

                                <Link
                                    href={`/ladders/${membership.ladder_id}`}
                                    className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
                                >
                                    View <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
