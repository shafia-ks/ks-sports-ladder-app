/**
 * Inactivity Penalty Calculation Utilities
 * 
 * This module handles the calculation and application of inactivity penalties
 * based on ladder settings and member activity.
 */

import { LadderInactivitySettings, PenaltyType } from "@/types/inactivity";

interface Member {
    id: string;
    user_id: string;
    current_rank: number | null;
    ladder_id: string;
}

interface PenaltyCalculationResult {
    shouldApplyPenalty: boolean;
    newRank?: number;
    penaltyType?: PenaltyType;
    penaltySeverity?: number;
    reason?: string;
    protectedByFloor?: boolean;
}

/**
 * Calculate the new rank after applying an inactivity penalty
 */
export function calculateInactivityPenalty(
    member: Member,
    settings: LadderInactivitySettings,
    totalMembers: number,
    daysInactive: number
): PenaltyCalculationResult {
    // Don't apply penalty if system is disabled
    if (!settings.enabled) {
        return { shouldApplyPenalty: false };
    }

    // Don't apply penalty if not past threshold
    if (daysInactive < settings.threshold_days) {
        return { shouldApplyPenalty: false };
    }

    // Don't apply penalty if member has no rank
    if (!member.current_rank || member.current_rank === 0) {
        return { shouldApplyPenalty: false };
    }

    const currentRank = member.current_rank;
    let newRank = currentRank;

    // Calculate penalty based on type
    switch (settings.penalty_type) {
        case "rank_drop":
            newRank = currentRank + settings.penalty_severity;
            break;

        case "percentage_drop":
            // Drop by percentage of total ladder size
            const percentageDrop = Math.ceil((settings.penalty_severity / 100) * totalMembers);
            newRank = currentRank + percentageDrop;
            break;

        case "point_deduction":
            // For point-based systems, this would deduct points
            // For now, we'll treat it as a rank drop
            newRank = currentRank + settings.penalty_severity;
            break;

        case "relegation":
            // Move to bottom of ladder
            newRank = totalMembers;
            break;

        case "removal":
            // This would remove the member from the ladder
            // Handled separately in the application logic
            return {
                shouldApplyPenalty: true,
                penaltyType: settings.penalty_type,
                penaltySeverity: settings.penalty_severity,
                reason: `Inactive for ${daysInactive} days (threshold: ${settings.threshold_days} days)`,
            };

        default:
            return { shouldApplyPenalty: false };
    }

    // Apply protection floor if enabled
    if (settings.floor_enabled && settings.floor_type && settings.floor_value) {
        const floorRank = calculateFloorRank(settings.floor_type, settings.floor_value, totalMembers);

        if (newRank > floorRank) {
            // Player would drop below floor, apply floor protection
            return {
                shouldApplyPenalty: true,
                newRank: floorRank,
                penaltyType: settings.penalty_type,
                penaltySeverity: settings.penalty_severity,
                reason: `Inactive for ${daysInactive} days (protected by floor at rank ${floorRank})`,
                protectedByFloor: true,
            };
        }
    }

    // Ensure new rank doesn't exceed total members
    newRank = Math.min(newRank, totalMembers);

    return {
        shouldApplyPenalty: true,
        newRank,
        penaltyType: settings.penalty_type,
        penaltySeverity: settings.penalty_severity,
        reason: `Inactive for ${daysInactive} days (threshold: ${settings.threshold_days} days)`,
        protectedByFloor: false,
    };
}

/**
 * Calculate the floor rank based on floor type and value
 */
function calculateFloorRank(
    floorType: "percentage" | "rank_position" | "division",
    floorValue: number,
    totalMembers: number
): number {
    if (floorType === "percentage") {
        // Floor is a percentage of the ladder
        // e.g., 80% means can't drop below rank that is 80% down the ladder
        return Math.ceil((floorValue / 100) * totalMembers);
    } else if (floorType === "rank_position") {
        // Floor is an absolute rank number
        return floorValue;
    } else {
        // Division-based floor (not implemented yet)
        return totalMembers;
    }
}

/**
 * Check if a member should receive a warning notification
 */
export function shouldSendWarning(
    daysInactive: number,
    thresholdDays: number,
    notificationDaysBefore: number
): boolean {
    const daysUntilPenalty = thresholdDays - daysInactive;
    return daysUntilPenalty > 0 && daysUntilPenalty <= notificationDaysBefore;
}

/**
 * Calculate days inactive from last match date
 */
export function calculateDaysInactive(lastMatchDate: string | null): number {
    if (!lastMatchDate) return 0;

    const lastMatch = new Date(lastMatchDate);
    const now = new Date();
    const diffTime = now.getTime() - lastMatch.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
}

/**
 * Check if member is in grace period (new member protection)
 */
export function isInGracePeriod(
    joinedAt: string,
    gracePeriodDays: number
): boolean {
    const joined = new Date(joinedAt);
    const now = new Date();
    const daysSinceJoined = Math.floor((now.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24));

    return daysSinceJoined < gracePeriodDays;
}
