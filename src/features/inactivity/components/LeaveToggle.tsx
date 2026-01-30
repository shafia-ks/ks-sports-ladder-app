"use client";

import { useState } from "react";
import { useMemberTracking, useLeaveUsage, useToggleLeave } from "../api/useLeaveManagement";
import { LEAVE_TYPE_LABELS, LEAVE_TYPE_ICONS, LeaveType } from "@/types/inactivity";

interface LeaveToggleProps {
    ladderId: string;
    userId: string;
}

export function LeaveToggle({ ladderId, userId }: LeaveToggleProps) {
    const { data: trackingData } = useMemberTracking(ladderId, userId);
    const { data: usageData } = useLeaveUsage(ladderId, userId);
    const toggleLeave = useToggleLeave(ladderId, userId);

    const tracking = trackingData;
    const usage = usageData;

    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType>("vacation");
    const [reason, setReason] = useState("");
    const [endDate, setEndDate] = useState("");

    const handleToggleLeave = async () => {
        if (tracking?.on_leave) {
            // End leave
            await toggleLeave.mutateAsync({
                on_leave: false,
            });
            setIsExpanded(false);
        } else {
            // Start break
            await toggleLeave.mutateAsync({
                on_leave: true,
                leave_type: selectedLeaveType,
                reason: reason || undefined,
                leave_ends_at: endDate ? new Date(endDate).toISOString() : undefined,
            });
            setReason("");
            setEndDate("");
            setIsExpanded(false);
        }
    };

    if (!tracking) {
        return null;
    }

    const isOnLeave = tracking.on_leave;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {isOnLeave ? (
                            <>
                                <span className="text-2xl">{LEAVE_TYPE_ICONS[tracking.leave_type as LeaveType]}</span>
                                On Leave
                            </>
                        ) : (
                            <>
                                <span className="text-2xl">🏃</span>
                                Active
                            </>
                        )}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {isOnLeave
                            ? `${LEAVE_TYPE_LABELS[tracking.leave_type as LeaveType]} since ${new Date(
                                tracking.leave_started_at!
                            ).toLocaleDateString()}`
                            : "You're currently active on this ladder"}
                    </p>
                </div>

                <button
                    onClick={() => (isOnLeave ? handleToggleLeave() : setIsExpanded(!isExpanded))}
                    className={`px-3 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2 rounded-md font-medium transition-colors ${isOnLeave
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-orange-600 hover:bg-orange-700 text-white"
                        }`}
                >
                    {isOnLeave ? "End Break" : "Take Break"}
                </button>
            </div>

            {isOnLeave && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md space-y-2">
                    {tracking.leave_reason && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Reason:</span> {tracking.leave_reason}
                        </p>
                    )}
                    {tracking.leave_ends_at && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Ends on:</span> {new Date(tracking.leave_ends_at).toLocaleDateString()}
                        </p>
                    )}
                </div>
            )}

            {isExpanded && !isOnLeave && (
                <div className="mt-6 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Break Type
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {(["vacation", "injury", "work_travel", "personal"] as LeaveType[]).map((type) => {
                                const used = usage?.[type] || 0;
                                const max = 3; // This should come from settings
                                const available = max - used;

                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setSelectedLeaveType(type)}
                                        disabled={available <= 0}
                                        className={`p-3 rounded-lg border-2 transition-all ${selectedLeaveType === type
                                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                            } ${available <= 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{LEAVE_TYPE_ICONS[type]}</span>
                                            <div className="text-left">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {LEAVE_TYPE_LABELS[type]}
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                                    {available > 0 ? `${available} left` : "None left"}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Reason (Optional)
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Family vacation, recovering from injury..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Automatically End Break On (Optional)
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Your status will automatically revert to Active on this date.
                        </p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                            What happens when you're on leave?
                        </h4>
                        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                            <li>✓ Inactivity penalties are paused</li>
                            <li>✓ You cannot challenge or be challenged</li>
                            <li>✓ Your rank may still drop if others move up</li>
                            <li>✓ You can return anytime</li>
                        </ul>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsExpanded(false)}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleToggleLeave}
                            disabled={toggleLeave.isPending}
                            className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {toggleLeave.isPending ? "Starting Break..." : "Start Break"}
                        </button>
                    </div>

                    {toggleLeave.isError && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-800 dark:text-red-200">
                            {(toggleLeave.error as any)?.message || "Failed to update leave status. Please try again."}
                        </div>
                    )}
                </div>
            )}

            {/* Usage Summary */}
            {!isExpanded && !isOnLeave && usage && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Leave Usage This Year</p>
                    <div className="grid grid-cols-4 gap-2">
                        {(["vacation", "injury", "work_travel", "personal"] as LeaveType[]).map((type) => {
                            const used = usage[type] || 0;
                            const max = 3; // This should come from settings

                            return (
                                <div key={type} className="text-center">
                                    <div className="text-lg">{LEAVE_TYPE_ICONS[type]}</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                        {used}/{max}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
