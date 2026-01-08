import { Users, Swords, Target, Activity } from "lucide-react";

interface StatCardData {
    label: string;
    value: number;
    subtitle: string;
    icon: "users" | "swords" | "target" | "activity";
    badge?: string;
    action: () => void;
}

interface OrganizerStatsGridProps {
    stats: StatCardData[];
}

export function OrganizerStatsGrid({ stats }: OrganizerStatsGridProps) {
    const getIcon = (icon: StatCardData["icon"]) => {
        const className = "h-6 w-6 text-brand-600";
        switch (icon) {
            case "users":
                return <Users className={className} />;
            case "swords":
                return <Swords className={className} />;
            case "target":
                return <Target className={className} />;
            case "activity":
                return <Activity className={className} />;
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <div key={index} className="card p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={stat.action}>
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className="text-sm text-slate-600">{stat.label}</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                                {stat.badge && (
                                    <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full font-semibold">
                                        {stat.badge}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{stat.subtitle}</p>
                        </div>
                        {getIcon(stat.icon)}
                    </div>
                    <button className="btn btn-sm btn-secondary w-full">
                        Manage
                    </button>
                </div>
            ))}
        </div>
    );
}
