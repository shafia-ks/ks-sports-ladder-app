"use client";

interface InactivityWarningBadgeProps {
    daysInactive: number;
    thresholdDays: number;
    size?: "sm" | "md";
}

export function InactivityWarningBadge({
    daysInactive,
    thresholdDays,
    size = "sm",
}: InactivityWarningBadgeProps) {
    const daysUntilPenalty = thresholdDays - daysInactive;

    // Don't show if not close to penalty
    if (daysUntilPenalty > 7) {
        return null;
    }

    const sizeClasses = {
        sm: "text-xs px-2 py-1",
        md: "text-sm px-3 py-1.5",
    };

    const iconSizes = {
        sm: "text-sm",
        md: "text-base",
    };

    // Color based on urgency
    const isCritical = daysUntilPenalty <= 3;
    const colorClasses = isCritical
        ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200";

    const tooltipContent = `
    Inactive for ${daysInactive} days
    ${daysUntilPenalty > 0 ? `Penalty in ${daysUntilPenalty} days` : "Penalty due!"}
  `.trim();

    return (
        <div className="relative group inline-block">
            <span
                className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${colorClasses}`}
                title={tooltipContent}
            >
                <span className={iconSizes[size]}>⚠️</span>
                <span>Inactive {daysInactive}d</span>
            </span>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                <div className="font-semibold">Inactivity Warning</div>
                <div className="text-gray-300">Inactive for {daysInactive} days</div>
                <div className={isCritical ? "text-red-400 font-semibold" : "text-yellow-400"}>
                    {daysUntilPenalty > 0 ? `Penalty in ${daysUntilPenalty} days` : "Penalty due!"}
                </div>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                    <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                </div>
            </div>
        </div>
    );
}
