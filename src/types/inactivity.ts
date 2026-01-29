// Inactivity Penalty System Types

export type CalculationMethod = 'calendar_month' | 'rolling_30_days' | 'rolling_custom';

export type PenaltyType = 'rank_drop' | 'percentage_drop' | 'point_deduction' | 'relegation' | 'removal';

export type PenaltyFrequency = 'once' | 'recurring_monthly' | 'recurring_period';

export type FloorType = 'rank_position' | 'percentage' | 'division';

export type PenaltyExceedsBottomAction = 'cap_at_bottom' | 'remove_from_ladder';

export type LeaveType = 'vacation' | 'injury' | 'work_travel' | 'personal';

export interface LadderInactivitySettings {
    id: string;
    ladder_id: string;

    // Master switch
    enabled: boolean;

    // Calculation method
    calculation_method: CalculationMethod;

    // Thresholds
    threshold_days: number;
    new_member_grace_days: number;

    // Penalty configuration
    penalty_type: PenaltyType;
    penalty_severity: number;
    penalty_frequency: PenaltyFrequency;

    // Protection floor
    floor_enabled: boolean;
    floor_type: FloorType;
    floor_value: number;

    // Notifications
    notify_before_penalty: boolean;
    notification_days_before: number;

    // Leave system
    leave_system_enabled: boolean;
    max_vacation_leaves_per_year: number;
    max_injury_leaves_per_year: number;
    max_work_leaves_per_year: number;
    max_personal_leaves_per_year: number;

    // Edge case handling
    penalty_exceeds_bottom_action: PenaltyExceedsBottomAction;

    created_at: string;
    updated_at: string;
}

export interface MemberInactivityTracking {
    id: string;
    ladder_id: string;
    user_id: string;

    // Tracking
    last_match_completed_at: string | null;
    last_penalty_applied_at: string | null;
    total_penalties_applied: number;

    // Leave of absence
    on_leave: boolean;
    leave_type: LeaveType | null;
    leave_started_at: string | null;
    leave_reason: string | null;

    // Penalty history
    positions_lost_to_inactivity: number;
    original_rank_before_penalties: number | null;

    created_at: string;
    updated_at: string;
}

export interface MemberLeaveHistory {
    id: string;
    ladder_id: string;
    user_id: string;

    leave_type: LeaveType;
    started_at: string;
    ended_at: string | null;
    reason: string | null;

    created_at: string;
}

export interface InactivityPenaltyLog {
    id: string;
    ladder_id: string;
    user_id: string;

    // Penalty details
    penalty_type: PenaltyType;
    penalty_severity: number;
    rank_before: number;
    rank_after: number;
    positions_dropped: number;

    // Context
    days_inactive: number;
    last_match_date: string | null;
    reason: string | null;
    capped_at_bottom: boolean;
    capped_at_floor: boolean;

    applied_at: string;
}

export interface LeaveUsage {
    vacation: number;
    injury: number;
    work_travel: number;
    personal: number;
}

export interface LeaveToggleRequest {
    on_leave: boolean;
    leave_type?: LeaveType;
    reason?: string;
}

export interface InactivityCheckResult {
    should_apply_penalty: boolean;
    days_inactive: number;
    reason?: string;
}

export interface PenaltyCalculationResult {
    new_rank: number;
    positions_dropped: number;
    capped_at_bottom: boolean;
    capped_at_floor: boolean;
    reason: string;
}

// Default settings
export const DEFAULT_INACTIVITY_SETTINGS: Omit<LadderInactivitySettings, 'id' | 'ladder_id' | 'created_at' | 'updated_at'> = {
    enabled: false,
    calculation_method: 'rolling_30_days',
    threshold_days: 30,
    new_member_grace_days: 14,
    penalty_type: 'rank_drop',
    penalty_severity: 3,
    penalty_frequency: 'once',
    floor_enabled: true,
    floor_type: 'percentage',
    floor_value: 50,
    notify_before_penalty: true,
    notification_days_before: 7,
    leave_system_enabled: true,
    max_vacation_leaves_per_year: 2,
    max_injury_leaves_per_year: 3,
    max_work_leaves_per_year: 2,
    max_personal_leaves_per_year: 2,
    penalty_exceeds_bottom_action: 'cap_at_bottom',
};

// Leave type display names
export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
    vacation: 'Vacation',
    injury: 'Injury',
    work_travel: 'Work/Travel',
    personal: 'Personal',
};

// Leave type icons
export const LEAVE_TYPE_ICONS: Record<LeaveType, string> = {
    vacation: '🏖️',
    injury: '🏥',
    work_travel: '💼',
    personal: '👤',
};
