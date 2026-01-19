"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { Zap, ArrowUpCircle, Swords } from "lucide-react";
import Link from "next/link";

interface SmartTarget {
    opponent_id: string;
    opponent_name: string;
    opponent_avatar_url: string | null;
    ladder_id: string;
    ladder_name: string;
    opponent_rank: number;
    rank_diff: number;
}

export function QuickChallengeWidget() {
    const { user } = useAuth();
    const [targets, setTargets] = useState<SmartTarget[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!user) return;
        async function fetchTargets() {
            try {
                const { data, error } = await (supabase.rpc as any)("get_smart_targets", { p_user_id: user!.id });
                if (error) {
                    console.error("Error fetching smart targets:", error);
                } else if (data) {
                    setTargets(data);
                }
            } catch (err) {
                console.error("Failed to fetch smart targets", err);
            } finally {
                setLoading(false);
            }
        }
        fetchTargets();
    }, [user]);

    if (!loading && targets.length === 0) {
        return (
            <div className="card overflow-hidden border-slate-200 bg-white shadow-sm p-6">
                <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-slate-400" />
                    <h2 className="text-lg font-bold text-slate-900">Climb the Ladder</h2>
                </div>
                <p className="text-sm text-slate-500">No available opponents to challenge right now. Check back later!</p>
            </div>
        );
    }

    if (loading) {
        return <div className="card p-6 h-48 animate-pulse bg-slate-50" />;
    }

    return (
        <div className="card overflow-hidden border-brand-100 bg-gradient-to-br from-white to-brand-50/20 shadow-sm transition-all hover:shadow-md">
            <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-amber-500 fill-amber-500" /> Climb the Ladder
                        </h2>
                        <p className="text-sm text-slate-500">Available opponents within your reach</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {targets.map((target) => (
                        <div key={`${target.ladder_id}-${target.opponent_id}`}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-100 hover:border-brand-300 transition-all group">
                            <div className="flex items-center gap-4">
                                <Avatar
                                    src={target.opponent_avatar_url}
                                    name={target.opponent_name}
                                    size="lg"
                                />
                                <div>
                                    <h3 className="font-semibold text-slate-900">{target.opponent_name}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-bold uppercase py-0.5 px-1.5 bg-slate-100 text-slate-600 rounded">Rank #{target.opponent_rank}</span>
                                        <span className="text-xs text-slate-500">{target.ladder_name}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-5">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Strategy</p>
                                    <p className="text-sm font-bold text-green-600 flex items-center gap-1">
                                        <ArrowUpCircle className="h-3 w-3" /> {target.rank_diff} {target.rank_diff === 1 ? 'spot' : 'spots'} up
                                    </p>
                                </div>
                                <Link
                                    href={`/ladders/${target.ladder_id}/challenge?opponent=${target.opponent_id}` as any}
                                    className="inline-flex items-center justify-center rounded-full bg-brand-600 px-5 py-2 text-sm font-bold text-white hover:bg-brand-700 transition-colors gap-2 shadow-sm shadow-brand-200"
                                >
                                    <Swords className="h-4 w-4" /> Challenge
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
