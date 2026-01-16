import { Trophy, TrendingUp, Flame } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { SkeletonStatCard } from "@/components/ui/skeleton-card";

interface KPICardsProps {
    stats: {
        activeLadders: number;
        winRate: number;
        currentStreak: number;
    } | null;
    loading: boolean;
}

export function KPICards({ stats, loading }: KPICardsProps) {
    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-3">
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <StatCard
                title="Active Ladders"
                value={stats?.activeLadders ?? 0}
                icon={<Trophy className="h-5 w-5 text-brand-600" />}
                variant="primary"
            />
            <StatCard
                title="Win Rate"
                value={`${stats?.winRate ?? 0}%`}
                icon={<TrendingUp className="h-5 w-5 text-success-600" />}
                variant="neutral"
            />
            <StatCard
                title="Current Streak"
                value={`${stats?.currentStreak ?? 0} Wins`}
                icon={<Flame className="h-5 w-5 text-orange-500" />}
                variant="neutral"
            />
        </div>
    );
}
