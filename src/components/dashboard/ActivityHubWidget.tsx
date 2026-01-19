"use client";

import { ActionRequiredWidget } from "./ActionRequiredWidget";
import { RecentActivityFeed } from "./RecentActivityFeed";
import { Trophy } from "lucide-react";

export function ActivityHub() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-brand-600" />
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Activity Hub</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <ActionRequiredWidget />
                <RecentActivityFeed />
            </div>
        </div>
    );
}
