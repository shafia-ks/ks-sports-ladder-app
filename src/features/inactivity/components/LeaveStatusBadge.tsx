"use client";

import { LEAVE_TYPE_LABELS, LEAVE_TYPE_ICONS, LeaveType } from "@/types/inactivity";

interface LeaveStatusBadgeProps {
    leaveType: LeaveType;
    leaveStartedAt: string;
    leaveReason?: string | null;
    size?: "sm" | "md";
}

export function LeaveStatusBadge({
    leaveType,
    leaveStartedAt,
    leaveReason,
    size = "sm",
}: LeaveStatusBadgeProps) {
    const sizeClasses = {
        sm: "text-xs px-2 py-1",
        md: "text-sm px-3 py-1.5",
    };

    const iconSizes = {
        sm: "text-sm",
        md: "text-base",
    };

    const tooltipContent = `
    ${LEAVE_TYPE_LABELS[leaveType]}
    Since: ${new Date(leaveStartedAt).toLocaleDateString()}
    ${leaveReason ? `Reason: ${leaveReason}` : ""}
  `.trim();

    return (
        <div className="relative group inline-block">
            <span
                className={`inline-flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-full font-medium ${sizeClasses[size]}`}
                title={tooltipContent}
            >
                <span className={iconSizes[size]}>{LEAVE_TYPE_ICONS[leaveType]}</span>
                <span>On Leave</span>
            </span>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                <div className="font-semibold">{LEAVE_TYPE_LABELS[leaveType]}</div>
                <div className="text-gray-300">Since {new Date(leaveStartedAt).toLocaleDateString()}</div>
                {leaveReason && <div className="text-gray-400 mt-1 max-w-xs whitespace-normal">{leaveReason}</div>}
                {/* Arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                    <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                </div>
            </div>
        </div>
    );
}
