import { Trophy, TrendingUp, Flame } from "lucide-react";

interface HeroStatsProps {
    rank: number | null;
    wins: number;
    losses: number;
    winStreak: number;
}

export function HeroStats({ rank, wins, losses, winStreak }: HeroStatsProps) {
    return (
        <div className="card p-6 bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <div className="grid grid-cols-3 gap-4">
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
                <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                        <Flame className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold">{winStreak}W</p>
                    <p className="text-xs opacity-90">Streak</p>
                </div>
            </div>
        </div>
    );
}
