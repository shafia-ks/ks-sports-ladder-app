import { Activity, Swords, Trophy, Users } from "lucide-react";

interface ActivityItem {
    id: string;
    type: "match" | "challenge" | "member";
    description: string;
    time: string;
}

interface RecentActivityProps {
    activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
    const getIcon = (type: ActivityItem["type"]) => {
        switch (type) {
            case "match":
                return <Trophy className="h-4 w-4 text-green-600" />;
            case "challenge":
                return <Swords className="h-4 w-4 text-blue-600" />;
            case "member":
                return <Users className="h-4 w-4 text-purple-600" />;
        }
    };

    return (
        <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-brand-600" />
                Recent Activity
            </h2>
            {activities.length > 0 ? (
                <div className="space-y-3">
                    {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                            <div className="mt-0.5">{getIcon(activity.type)}</div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-900">{activity.description}</p>
                                <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-slate-500 text-center py-8">No recent activity</p>
            )}
        </div>
    );
}
