import { Trophy, TrendingUp, Flame } from "lucide-react";
import Link from "next/link";

interface HeroStatsProps {
    rank: number | null;
    wins: number;
    losses: number;
    winStreak: number;
    ladderId: string;
}

export function HeroStats({ rank, wins, losses, winStreak, ladderId }: HeroStatsProps) {
    return (
        <div className="card p-6 bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                        <Trophy className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold">#{rank || "-"}</p>
                    <p className="text-xs opacity-90">Rank</p>
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold">{wins}-{losses}</p>
                    <p className="text-xs opacity-90">W/L</p>
                </div>
                <div className="text-center col-span-2 md:col-span-1">
                    <div className="flex items-center justify-center mb-2">
                        <Flame className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold">{winStreak}W</p>
                    <p className="text-xs opacity-90">Streak</p>
                </div>
            </div>
            <div className="flex gap-3">
                <Link
                    href={`/challenges/create?ladder=${ladderId}`}
                    className="flex-1 btn bg-white text-brand-700 hover:bg-slate-50 font-semibold"
                >
                    Challenge Someone
                </Link>
                <Link
                    href={`/ladders/${ladderId}/matches`}
                    className="flex-1 btn border-2 border-white text-white hover:bg-white/10 font-semibold"
                >
                    View My Matches
                </Link>
            </div>
        </div>
    );
}
