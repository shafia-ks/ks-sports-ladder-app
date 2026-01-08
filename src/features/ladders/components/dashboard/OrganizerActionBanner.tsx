import { Zap } from "lucide-react";

interface ActionItem {
    id: string;
    label: string;
    count: number;
    action: () => void;
    buttonText: string;
}

interface OrganizerActionBannerProps {
    actions: ActionItem[];
}

export function OrganizerActionBanner({ actions }: OrganizerActionBannerProps) {
    if (actions.length === 0) return null;

    const totalActions = actions.reduce((sum, action) => sum + action.count, 0);

    return (
        <div className="card p-5 bg-amber-50 border-2 border-amber-200">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-600" />
                    <h2 className="text-lg font-semibold text-amber-900">
                        Action Required ({totalActions})
                    </h2>
                </div>
            </div>
            <div className="space-y-2">
                {actions.map((action) => (
                    <div key={action.id} className="flex items-center justify-between py-2">
                        <span className="text-sm text-amber-900">
                            • {action.label}
                        </span>
                        <button
                            onClick={action.action}
                            className="btn btn-primary btn-sm"
                        >
                            {action.buttonText}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
